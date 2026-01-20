// src/app/api/v1/time-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ============================================
   Helpers
============================================ */
function createDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function getExpectedSlotCount(dateStr: string): number {
  const dayOfWeek = new Date(dateStr).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return isWeekend ? 8 : 12; // weekend 08-16, weekday 08-20
}

async function generateDefaultSlots(dateStr: string): Promise<number> {
  const dayOfWeek = new Date(dateStr).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const openTime = "08:00";
  const closeTime = isWeekend ? "16:00" : "20:00";
  const slotDuration = 60;

  const slots: { start: Date; end: Date }[] = [];
  let currentTime = createDateTime(dateStr, openTime);
  const endTime = createDateTime(dateStr, closeTime);

  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, slotDuration);
    if (slotEnd <= endTime) slots.push({ start: new Date(currentTime), end: slotEnd });
    currentTime = slotEnd;
  }

  console.log(
    `[generateDefaultSlots] ${dateStr}: Generating ${slots.length} slots (${openTime}-${closeTime})`
  );

  if (slots.length === 0) return 0;

  // NOTE: skipDuplicates จะทำงานได้ “ต้องมี unique index” ใน schema
  // เช่น @@unique([time_slot_start_datetime, time_slot_end_datetime])
  const result = await prisma.timeSlot.createMany({
    data: slots.map((s) => ({
      time_slot_start_datetime: s.start,
      time_slot_end_datetime: s.end,
      time_slot_max_capacity: 1,
      time_slot_status: "AVAILABLE",
    })),
    skipDuplicates: true,
  });

  console.log(`[generateDefaultSlots] ${dateStr}: Created ${result.count} slots`);
  return result.count;
}

/* ============================================
   GET /api/v1/time-slots?date=YYYY-MM-DD
============================================ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

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

    const whereClause = {
      time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
    };

    // ✅ schema ใหม่: TimeSlot include bookings (ไม่ใช่ bookingSlots)
    let timeSlots = await prisma.timeSlot.findMany({
      where: whereClause,
      include: {
        bookings: {
          select: {
            booking_id: true,
            booking_status: true,
          },
        },
      },
      orderBy: { time_slot_start_datetime: "asc" },
    });

    const expectedCount = getExpectedSlotCount(dateStr);
    const currentCount = timeSlots.length;

    console.log(`[GET /time-slots] ${dateStr}: Found ${currentCount}/${expectedCount} slots`);

    // ✅ ถ้า slot ไม่ครบ → regenerate (ลบเฉพาะ slots ที่ไม่มี booking)
    if (currentCount < expectedCount) {
      console.log(`[GET /time-slots] ${dateStr}: Incomplete slots, regenerating...`);

      if (currentCount > 0) {
        const deleted = await prisma.timeSlot.deleteMany({
          where: {
            time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
            bookings: { none: {} }, // ✅ ไม่มี booking เลย ถึงลบได้
          },
        });
        console.log(`[GET /time-slots] ${dateStr}: Deleted ${deleted.count} orphan slots`);
      }

      await generateDefaultSlots(dateStr);

      timeSlots = await prisma.timeSlot.findMany({
        where: whereClause,
        include: {
          bookings: {
            select: {
              booking_id: true,
              booking_status: true,
            },
          },
        },
        orderBy: { time_slot_start_datetime: "asc" },
      });

      console.log(`[GET /time-slots] ${dateStr}: After regeneration: ${timeSlots.length} slots`);
    }

    const now = new Date();

    const ACTIVE_STATUSES = [
      "PENDING_ASSIGNMENT",
      "ASSIGNED",
      "IN_PROGRESS",
    ] as const;

    const formattedSlots = timeSlots.map((slot) => {
      const activeBookings = slot.bookings.filter((b) =>
        ACTIVE_STATUSES.includes(b.booking_status as (typeof ACTIVE_STATUSES)[number])
      ).length;

      const maxCap = Number(slot.time_slot_max_capacity ?? 0);
      const availableCount = Math.max(0, maxCap - activeBookings);

      const isClosed = slot.time_slot_status === "LOCKED" || slot.time_slot_status === "CANCELLED";

      const slotStart = slot.time_slot_start_datetime;

      // เวลาผ่านแล้ว (เฉพาะวันเดียวกัน)
      const isPastTime =
        slotStart.toDateString() === now.toDateString() && slotStart <= now;

      const isAvailable =
        slot.time_slot_status === "AVAILABLE" &&
        availableCount > 0 &&
        !isClosed &&
        !isPastTime;

      let unavailableReason: "PAST_TIME" | "FULL" | "CLOSED" | "UNAVAILABLE" | null = null;

      if (!isAvailable) {
        if (isPastTime) unavailableReason = "PAST_TIME";
        else if (isClosed) unavailableReason = "CLOSED";
        else if (availableCount <= 0) unavailableReason = "FULL";
        else unavailableReason = "UNAVAILABLE";
      }

      return {
        id: slot.time_slot_id,
        date: slotStart.toISOString().split("T")[0],
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
    });

    return NextResponse.json({
      success: true,
      date: dateStr,
      slots: formattedSlots,
    });
  } catch (error) {
    console.error("[GET /time-slots] Error:", error);
    return NextResponse.json({ error: "Failed to fetch time slots" }, { status: 500 });
  }
}

/* ============================================
   POST /api/v1/time-slots
============================================ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, slots, generateDefault } = body;

    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    // auto-generate
    if (generateDefault) {
      const created = await generateDefaultSlots(date);
      return NextResponse.json({
        success: true,
        message: `Created ${created} time slots`,
        date,
      });
    }

    // manual slots
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: "Slots array is required" }, { status: 400 });
    }

    const created = await prisma.timeSlot.createMany({
      data: slots.map((s: { startTime: string; endTime: string; maxCapacity?: number }) => ({
        time_slot_start_datetime: createDateTime(date, s.startTime),
        time_slot_end_datetime: createDateTime(date, s.endTime),
        time_slot_max_capacity: s.maxCapacity || 1,
        time_slot_status: "AVAILABLE",
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: `Created ${created.count} time slots`,
      date,
    });
  } catch (error) {
    console.error("[POST /time-slots] Error:", error);
    return NextResponse.json({ error: "Failed to create time slots" }, { status: 500 });
  }
}

/* ============================================
   DELETE /api/v1/time-slots?date=YYYY-MM-DD
   ลบเฉพาะ slots ที่ไม่มี booking เลย
============================================ */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    const deleted = await prisma.timeSlot.deleteMany({
      where: {
        time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
        bookings: { none: {} }, // ✅ schema ใหม่
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} time slots`,
      date: dateStr,
    });
  } catch (error) {
    console.error("[DELETE /time-slots] Error:", error);
    return NextResponse.json({ error: "Failed to delete time slots" }, { status: 500 });
  }
}

/* ============================================
   PATCH /api/v1/time-slots?date=YYYY-MM-DD&action=regenerate
============================================ */
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const action = searchParams.get("action");

    if (!dateStr) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    if (action !== "regenerate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    const deleted = await prisma.timeSlot.deleteMany({
      where: {
        time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
        bookings: { none: {} }, // ✅ ลบได้เฉพาะ slot ที่ไม่ผูก booking
      },
    });

    const created = await generateDefaultSlots(dateStr);

    const total = await prisma.timeSlot.count({
      where: { time_slot_start_datetime: { gte: startOfDay, lte: endOfDay } },
    });

    return NextResponse.json({
      success: true,
      message: `Regenerated slots for ${dateStr}`,
      deleted: deleted.count,
      created,
      total,
    });
  } catch (error) {
    console.error("[PATCH /time-slots] Error:", error);
    return NextResponse.json({ error: "Failed to regenerate" }, { status: 500 });
  }
}
