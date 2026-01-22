// src/app/api/v2/time-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";

/* ============================================
   Helpers (Bangkok timezone safe)
============================================ */
const BKK_TZ = "Asia/Bangkok";
const BKK_OFFSET = "+07:00";

// ✅ เปิด/ปิด auto-generate เมื่อ GET แล้ววันนั้นไม่มี slot เลย
const AUTO_GENERATE_IF_EMPTY = true;

// ✅ Roles ที่เข้าถึง time-slots ได้ (แก้ที่นี่ที่เดียว)
const TIME_SLOT_VIEW_ROLES = [
  "STUDENT",
  "CONSULTANT",
  "HEAD_CONSULTANT",
  "ADMIN",
  "SUPER_ADMIN",
  "RECTOR",
] as const;

const TIME_SLOT_STAFF_ROLES = [
  "HEAD_CONSULTANT",
  "ADMIN",
  "SUPER_ADMIN",
  "RECTOR",
] as const;

function createDateTime(dateStr: string, timeStr: string): Date {
  // exact instant based on Bangkok local time
  return new Date(`${dateStr}T${timeStr}:00.000${BKK_OFFSET}`);
}

function getDayRangeBangkok(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000${BKK_OFFSET}`);
  const end = new Date(`${dateStr}T23:59:59.999${BKK_OFFSET}`);
  return { start, end };
}

function fmtDateBkk(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function fmtTimeBkk(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BKK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function isValidDateStr(dateStr: string) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const { start } = getDayRangeBangkok(dateStr);
  return !isNaN(start.getTime());
}

function getSlotTemplate(dateStr: string) {
  const dayOfWeek = new Date(`${dateStr}T00:00:00.000${BKK_OFFSET}`).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const openTime = "08:00";
  const closeTime = isWeekend ? "16:00" : "20:00";
  const slotDuration = 60;

  return { openTime, closeTime, slotDuration, isWeekend };
}

/** สร้าง slot แบบ "คิวรวมของมหาลัย" สำหรับวันนั้น */
async function generateDefaultSlotsForUniversity(
  dateStr: string,
  universityId: number
): Promise<number> {
  const { openTime, closeTime, slotDuration } = getSlotTemplate(dateStr);

  const slots: { start: Date; end: Date }[] = [];
  let currentTime = createDateTime(dateStr, openTime);
  const endTime = createDateTime(dateStr, closeTime);

  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, slotDuration);
    if (slotEnd <= endTime) slots.push({ start: new Date(currentTime), end: slotEnd });
    currentTime = slotEnd;
  }

  if (slots.length === 0) return 0;

  const DEFAULT_CAPACITY = 2;

  const data = slots.map((s) => ({
    university_id: universityId,
    time_slot_start_datetime: s.start,
    time_slot_end_datetime: s.end,
    time_slot_max_capacity: DEFAULT_CAPACITY,
    time_slot_status: "AVAILABLE" as const,
  }));

  // @@unique([university_id, time_slot_start_datetime, time_slot_end_datetime])
  const result = await prisma.timeSlot.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}

const ACTIVE_STATUSES = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] as const;
type UnavailableReason = "PAST_TIME" | "FULL" | "CLOSED" | "UNAVAILABLE";

/* ============================================
   GET /api/v2/time-slots?date=YYYY-MM-DD
   - tenant-safe: คืนเฉพาะ activeUniversityId
   - คิวรวม (ไม่ผูก consultant)
============================================ */
export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // ✅ role gate
    assertRole(account.role, [...TIME_SLOT_VIEW_ROLES]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ success: false, error: "Date is required (YYYY-MM-DD)" }, { status: 400 });
    }
    if (!isValidDateStr(dateStr)) {
      return NextResponse.json({ success: false, error: "Invalid date format/value. Use YYYY-MM-DD" }, { status: 400 });
    }

    const { start: startOfDay, end: endOfDay } = getDayRangeBangkok(dateStr);

    // 1) โหลด slots
    let timeSlots = await prisma.timeSlot.findMany({
      where: {
        university_id: activeUniversityId,
        time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { time_slot_start_datetime: "asc" },
    });

    // ✅ optional: ถ้าไม่มี slot เลย => generate default แล้วโหลดใหม่
    if (AUTO_GENERATE_IF_EMPTY && timeSlots.length === 0) {
      await generateDefaultSlotsForUniversity(dateStr, activeUniversityId);
      timeSlots = await prisma.timeSlot.findMany({
        where: {
          university_id: activeUniversityId,
          time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { time_slot_start_datetime: "asc" },
      });
    }

    const slotIds = timeSlots.map((s) => s.time_slot_id);

    // 2) groupBy นับ booking ต่อ slot ทีเดียว
    const bookingCounts = slotIds.length
      ? await prisma.booking.groupBy({
          by: ["time_slot_id"],
          where: {
            time_slot_id: { in: slotIds },
            booking_status: { in: ACTIVE_STATUSES as any },
          },
          _count: { _all: true },
        })
      : [];

    const countMap = new Map<number, number>();
    for (const row of bookingCounts) {
      countMap.set(row.time_slot_id, row._count._all);
    }

    const now = Date.now();

    const formattedSlots = timeSlots.map((slot) => {
      const activeBookings = countMap.get(slot.time_slot_id) ?? 0;

      const maxCap = Number(slot.time_slot_max_capacity ?? 0);
      const availableCount = Math.max(0, maxCap - activeBookings);

      // ✅ ปิด slot ถ้า LOCKED/CANCELLED หรือ status ไม่ AVAILABLE
      const isClosed =
        slot.time_slot_status === "LOCKED" ||
        slot.time_slot_status === "CANCELLED" ||
        slot.time_slot_status !== "AVAILABLE";

      const slotStart = slot.time_slot_start_datetime;
      const slotEnd = slot.time_slot_end_datetime;

      // ✅ past ที่ “สมเหตุสมผล” กว่า: ถ้า end <= now ถือว่าหมดเวลา
      const isPastTime = slotEnd.getTime() <= now;

      const isAvailable = !isClosed && availableCount > 0 && !isPastTime;

      let unavailableReason: UnavailableReason | null = null;
      if (!isAvailable) {
        if (isPastTime) unavailableReason = "PAST_TIME";
        else if (isClosed) unavailableReason = "CLOSED";
        else if (availableCount <= 0) unavailableReason = "FULL";
        else unavailableReason = "UNAVAILABLE";
      }

      return {
        id: slot.time_slot_id,
        universityId: slot.university_id,

        date: fmtDateBkk(slotStart),
        startTime: fmtTimeBkk(slotStart),
        endTime: fmtTimeBkk(slotEnd),

        startDateTime: slotStart.toISOString(),
        endDateTime: slotEnd.toISOString(),

        maxCapacity: maxCap,
        bookedCount: activeBookings,
        availableCount,
        status: slot.time_slot_status,

        isAvailable,
        isClosed,
        isPastTime,
        unavailableReason,
      };
    });

    const res = NextResponse.json({
      success: true,
      date: dateStr,
      universityId: activeUniversityId,
      slots: formattedSlots,
    });

    // ✅ กัน cache
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error: any) {
    console.error("[GET /v2/time-slots] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to fetch time slots" },
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
    assertRole(account.role, [...TIME_SLOT_STAFF_ROLES]);

    const body = await req.json().catch(() => ({}));
    const date = String(body?.date || "").trim();
    const generateDefault = Boolean(body?.generateDefault);

    if (!date) return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    if (!isValidDateStr(date)) {
      return NextResponse.json({ success: false, error: "Invalid date format/value. Use YYYY-MM-DD" }, { status: 400 });
    }

    if (generateDefault) {
      const created = await generateDefaultSlotsForUniversity(date, activeUniversityId);
      return NextResponse.json({
        success: true,
        message: `Created ${created} time slots`,
        date,
        universityId: activeUniversityId,
      });
    }

    return NextResponse.json({ success: false, error: "Only generateDefault is supported in v2" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /v2/time-slots] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to create time slots" },
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
    assertRole(account.role, [...TIME_SLOT_STAFF_ROLES]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    if (!isValidDateStr(dateStr)) {
      return NextResponse.json({ success: false, error: "Invalid date format/value. Use YYYY-MM-DD" }, { status: 400 });
    }

    const { start: startOfDay, end: endOfDay } = getDayRangeBangkok(dateStr);

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
      { success: false, error: error?.message ?? "Failed to delete time slots" },
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
    assertRole(account.role, [...TIME_SLOT_STAFF_ROLES]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const action = searchParams.get("action");

    if (!dateStr) return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    if (!isValidDateStr(dateStr)) {
      return NextResponse.json({ success: false, error: "Invalid date format/value. Use YYYY-MM-DD" }, { status: 400 });
    }
    if (action !== "regenerate") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const { start: startOfDay, end: endOfDay } = getDayRangeBangkok(dateStr);

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
      { success: false, error: error?.message ?? "Failed to regenerate" },
      { status: error?.status ?? 500 }
    );
  }
}
