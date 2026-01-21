// src/app/api/v2/time-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenants/server";

/* ============================================
   Helpers
============================================ */
function createDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function getSlotTemplate(dateStr: string) {
  const dayOfWeek = new Date(dateStr).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const openTime = "08:00";
  const closeTime = isWeekend ? "16:00" : "20:00";
  const slotDuration = 60;

  return { openTime, closeTime, slotDuration, isWeekend };
}

/** สร้าง slot ให้ "ทุก consultant ในมหาลัยนั้น" สำหรับวันนั้น */
async function generateDefaultSlotsForUniversity(dateStr: string, universityId: number): Promise<number> {
  const { openTime, closeTime, slotDuration } = getSlotTemplate(dateStr);

  const consultants = await prisma.consultant.findMany({
    where: { university_id: universityId },
    select: { consultant_id: true },
  });

  if (consultants.length === 0) {
    console.log(`[generateDefaultSlotsForUniversity] uni=${universityId} has no consultants`);
    return 0;
  }

  const slots: { start: Date; end: Date }[] = [];
  let currentTime = createDateTime(dateStr, openTime);
  const endTime = createDateTime(dateStr, closeTime);

  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, slotDuration);
    if (slotEnd <= endTime) slots.push({ start: new Date(currentTime), end: slotEnd });
    currentTime = slotEnd;
  }

  console.log(
    `[generateDefaultSlotsForUniversity] ${dateStr} uni=${universityId}: ${slots.length} slots per consultant, consultants=${consultants.length}`
  );

  if (slots.length === 0) return 0;

  // createMany แบบ bulk: consultants x slots
  const data = consultants.flatMap((c) =>
    slots.map((s) => ({
      university_id: universityId,
      consultant_id: c.consultant_id,
      time_slot_start_datetime: s.start,
      time_slot_end_datetime: s.end,
      time_slot_max_capacity: 1,
      time_slot_status: "AVAILABLE" as const,
    }))
  );

  // ต้องมี unique composite เช่น @@unique([consultant_id, time_slot_start_datetime, time_slot_end_datetime])
  const result = await prisma.timeSlot.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`[generateDefaultSlotsForUniversity] created=${result.count}`);
  return result.count;
}

function toIsoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

const ACTIVE_STATUSES = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] as const;
type UnavailableReason = "PAST_TIME" | "FULL" | "CLOSED" | "UNAVAILABLE";

/* ============================================
   GET /api/v2/time-slots?date=YYYY-MM-DD
   - tenant-safe: คืนเฉพาะ activeUniversityId
============================================ */
export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    assertRole(account.role, [
      "STUDENT",
      "CONSULTANT",
      "HEAD_CONSULTANT",
      "ADMIN",
      "SUPER_ADMIN",
      "RECTOR",
    ]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    // optional filter: consultantId (เฉพาะ staff หรือ consultant เอง)
    const consultantIdStr = searchParams.get("consultantId");
    const consultantId = consultantIdStr ? Number(consultantIdStr) : null;

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required (YYYY-MM-DD)" }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);
    if (isNaN(startOfDay.getTime())) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }

    const whereClause: any = {
      university_id: activeUniversityId,
      time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
    };

    // role guard เรื่อง consultantId
    if (account.role === "CONSULTANT") {
      if (!account.consultantId) {
        return NextResponse.json({ error: "Consultant profile not found" }, { status: 400 });
      }
      whereClause.consultant_id = account.consultantId;
    } else if (consultantId) {
      whereClause.consultant_id = consultantId;
    }

    // ✅ IMPORTANT: ไม่ include bookings เพราะ schema ของคุณไม่มี relation ชื่อนี้
    const timeSlots = await prisma.timeSlot.findMany({
      where: whereClause,
      include: {
        consultant: {
          select: {
            consultant_id: true,
            profile: { select: { consultant_first_name: true, consultant_last_name: true } },
          },
        },
      },
      orderBy: { time_slot_start_datetime: "asc" },
    });

    const now = new Date();

    // ✅ นับ booking ต่อ slot ด้วย booking.count แทน slot.bookings
    const formattedSlots = await Promise.all(
      timeSlots.map(async (slot) => {
        const activeBookings = await prisma.booking.count({
          where: {
            time_slot_id: slot.time_slot_id,
            booking_status: { in: ACTIVE_STATUSES as any },
          },
        });

        const maxCap = Number(slot.time_slot_max_capacity ?? 0);
        const availableCount = Math.max(0, maxCap - activeBookings);

        const isClosed = slot.time_slot_status === "LOCKED" || slot.time_slot_status === "CANCELLED";
        const slotStart = slot.time_slot_start_datetime;

        const isPastTime = slotStart.toDateString() === now.toDateString() && slotStart <= now;

        const isAvailable =
          slot.time_slot_status === "AVAILABLE" &&
          availableCount > 0 &&
          !isClosed &&
          !isPastTime;

        let unavailableReason: UnavailableReason | null = null;

        if (!isAvailable) {
          if (isPastTime) unavailableReason = "PAST_TIME";
          else if (isClosed) unavailableReason = "CLOSED";
          else if (availableCount <= 0) unavailableReason = "FULL";
          else unavailableReason = "UNAVAILABLE";
        }

        const cProfile = slot.consultant?.profile;

        return {
          id: slot.time_slot_id,
          universityId: slot.university_id,
          consultantId: slot.consultant_id,
          consultantName: cProfile
            ? `${cProfile.consultant_first_name} ${cProfile.consultant_last_name}`
            : null,

          date: toIsoDate(slotStart),
          startTime: slotStart.toTimeString().slice(0, 5),
          endTime: slot.time_slot_end_datetime.toTimeString().slice(0, 5),

          startDateTime: slotStart.toISOString(),
          endDateTime: slot.time_slot_end_datetime.toISOString(),

          maxCapacity: maxCap,
          bookedCount: activeBookings,
          availableCount,
          status: slot.time_slot_status,

          isAvailable,
          isClosed,
          isPastTime,
          unavailableReason,
        };
      })
    );

    return NextResponse.json({
      success: true,
      date: dateStr,
      universityId: activeUniversityId,
      slots: formattedSlots,
    });
  } catch (error: any) {
    console.error("[GET /v2/time-slots] Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch time slots" },
      { status: error?.status ?? 500 }
    );
  }
}

/* ============================================
   POST /api/v2/time-slots
   - staff only
   body:
     { date: "YYYY-MM-DD", generateDefault: true }
============================================ */
export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    assertRole(account.role, ["HEAD_CONSULTANT", "ADMIN", "SUPER_ADMIN", "RECTOR"]);

    const body = await req.json();
    const { date, generateDefault } = body;

    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    if (generateDefault) {
      const created = await generateDefaultSlotsForUniversity(date, activeUniversityId);
      return NextResponse.json({
        success: true,
        message: `Created ${created} time slots`,
        date,
        universityId: activeUniversityId,
      });
    }

    return NextResponse.json({ error: "Only generateDefault is supported in v2" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /v2/time-slots] Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create time slots" },
      { status: error?.status ?? 500 }
    );
  }
}

/* ============================================
   DELETE /api/v2/time-slots?date=YYYY-MM-DD
   - staff only
   - ลบเฉพาะ slots ที่ไม่มี booking เลย
============================================ */
export async function DELETE(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["HEAD_CONSULTANT", "ADMIN", "SUPER_ADMIN", "RECTOR"]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    // ✅ ไม่ใช้ bookings relation -> หา slot ids ของวันนี้ก่อน
    const slotIds = await prisma.timeSlot.findMany({
      where: {
        university_id: activeUniversityId,
        time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
      },
      select: { time_slot_id: true },
    });
    const ids = slotIds.map((x) => x.time_slot_id);
    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Deleted 0 time slots`,
        date: dateStr,
        universityId: activeUniversityId,
      });
    }

    // หา slot ที่มี booking อยู่ (เอาออกจากการลบ)
    const used = await prisma.booking.findMany({
      where: { time_slot_id: { in: ids } },
      select: { time_slot_id: true },
      distinct: ["time_slot_id"],
    });
    const usedSet = new Set(used.map((u) => u.time_slot_id));
    const deletableIds = ids.filter((id) => !usedSet.has(id));

    const deleted = await prisma.timeSlot.deleteMany({
      where: { time_slot_id: { in: deletableIds } },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} time slots`,
      date: dateStr,
      universityId: activeUniversityId,
    });
  } catch (error: any) {
    console.error("[DELETE /v2/time-slots] Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete time slots" },
      { status: error?.status ?? 500 }
    );
  }
}

/* ============================================
   PATCH /api/v2/time-slots?date=YYYY-MM-DD&action=regenerate
   - staff only
============================================ */
export async function PATCH(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["HEAD_CONSULTANT", "ADMIN", "SUPER_ADMIN", "RECTOR"]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const action = searchParams.get("action");

    if (!dateStr) return NextResponse.json({ error: "Date is required" }, { status: 400 });
    if (action !== "regenerate") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    // ✅ ลบเฉพาะ slot ที่ไม่มี booking (ไม่ใช้ relation)
    const slotIds = await prisma.timeSlot.findMany({
      where: {
        university_id: activeUniversityId,
        time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
      },
      select: { time_slot_id: true },
    });
    const ids = slotIds.map((x) => x.time_slot_id);

    let deletedCount = 0;
    if (ids.length > 0) {
      const used = await prisma.booking.findMany({
        where: { time_slot_id: { in: ids } },
        select: { time_slot_id: true },
        distinct: ["time_slot_id"],
      });

      const usedSet = new Set(used.map((u) => u.time_slot_id));
      const deletableIds = ids.filter((id) => !usedSet.has(id));

      const deleted = await prisma.timeSlot.deleteMany({
        where: { time_slot_id: { in: deletableIds } },
      });
      deletedCount = deleted.count;
    }

    const created = await generateDefaultSlotsForUniversity(dateStr, activeUniversityId);

    const total = await prisma.timeSlot.count({
      where: {
        university_id: activeUniversityId,
        time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Regenerated slots for ${dateStr}`,
      deleted: deletedCount,
      created,
      total,
      date: dateStr,
      universityId: activeUniversityId,
    });
  } catch (error: any) {
    console.error("[PATCH /v2/time-slots] Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to regenerate" },
      { status: error?.status ?? 500 }
    );
  }
}
