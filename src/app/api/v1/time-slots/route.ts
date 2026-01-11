// src/app/api/v1/time-slots/route.ts
// ✅ Fixed: Auto-regenerate if slots are incomplete

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ============================================
// Helper Functions
// ============================================

function createDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// ✅ คำนวณจำนวน slots ที่ควรมีในแต่ละวัน
function getExpectedSlotCount(dateStr: string): number {
  const dayOfWeek = new Date(dateStr).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // วันธรรมดา: 08:00-20:00 = 12 slots (ชั่วโมงละ 1)
  // วันหยุด: 08:00-16:00 = 8 slots
  return isWeekend ? 8 : 12;
}

// ✅ Generate default slots พร้อม logging
async function generateDefaultSlots(date: string): Promise<number> {
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const openTime = "08:00";
  const closeTime = isWeekend ? "16:00" : "20:00";
  const slotDuration = 60;

  const slots: { start: Date; end: Date }[] = [];

  let currentTime = createDateTime(date, openTime);
  const endTime = createDateTime(date, closeTime);

  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, slotDuration);
    if (slotEnd <= endTime) {
      slots.push({ start: new Date(currentTime), end: slotEnd });
    }
    currentTime = slotEnd;
  }

  console.log(`[generateDefaultSlots] ${date}: Generating ${slots.length} slots (${openTime}-${closeTime})`);

  if (slots.length === 0) return 0;

  const result = await prisma.timeSlot.createMany({
    data: slots.map((s) => ({
      time_slot_start_datetime: s.start,
      time_slot_end_datetime: s.end,
      time_slot_max_capacity: 1,
      time_slot_status: "AVAILABLE",
    })),
    skipDuplicates: true,
  });

  console.log(`[generateDefaultSlots] ${date}: Created ${result.count} slots`);
  return result.count;
}

// ============================================
// GET /api/v1/time-slots?date=YYYY-MM-DD
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    // Validate parsed date
    if (isNaN(startOfDay.getTime())) {
      return NextResponse.json(
        { error: "Invalid date value" },
        { status: 400 }
      );
    }

    const whereClause = {
      time_slot_start_datetime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // ดึง time slots
    let timeSlots = await prisma.timeSlot.findMany({
      where: whereClause,
      include: {
        bookingSlots: {
          include: {
            booking: {
              select: {
                booking_id: true,
                booking_status: true,
              },
            },
          },
        },
      },
      orderBy: { time_slot_start_datetime: "asc" },
    });

    // ✅ เช็คว่ามีครบไหม ไม่ใช่แค่มีหรือไม่
    const expectedCount = getExpectedSlotCount(dateStr);
    const currentCount = timeSlots.length;

    console.log(`[GET /time-slots] ${dateStr}: Found ${currentCount}/${expectedCount} slots`);

    if (currentCount < expectedCount) {
      console.log(`[GET /time-slots] ${dateStr}: Incomplete slots, regenerating...`);

      // ลบ slots เดิมที่ไม่มี booking (ถ้ามี)
      if (currentCount > 0) {
        const deleted = await prisma.timeSlot.deleteMany({
          where: {
            time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
            bookingSlots: { none: {} },
          },
        });
        console.log(`[GET /time-slots] ${dateStr}: Deleted ${deleted.count} orphan slots`);
      }

      // Generate ใหม่
      await generateDefaultSlots(dateStr);

      // Query อีกครั้ง
      timeSlots = await prisma.timeSlot.findMany({
        where: whereClause,
        include: {
          bookingSlots: {
            include: {
              booking: {
                select: {
                  booking_id: true,
                  booking_status: true,
                },
              },
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

    // Format response
    const formattedSlots = timeSlots.map((slot) => {
      const activeBookings = slot.bookingSlots.filter((bs) =>
        ACTIVE_STATUSES.includes(
          bs.booking.booking_status as (typeof ACTIVE_STATUSES)[number]
        )
      ).length;

      const availableCount = Math.max(
        0,
        slot.time_slot_max_capacity - activeBookings
      );

      const isClosed =
        slot.time_slot_status === "LOCKED" ||
        slot.time_slot_status === "CANCELLED";

      const slotStart = slot.time_slot_start_datetime;

      // เวลาเลยแล้ว (วันนี้เท่านั้น)
      const isPastTime =
        slotStart.toDateString() === now.toDateString() && slotStart <= now;

      const isAvailable =
        slot.time_slot_status === "AVAILABLE" &&
        availableCount > 0 &&
        !isClosed &&
        !isPastTime;

      let unavailableReason:
        | "PAST_TIME"
        | "FULL"
        | "CLOSED"
        | "UNAVAILABLE"
        | null = null;

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

        maxCapacity: slot.time_slot_max_capacity,
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
    return NextResponse.json(
      { error: "Failed to fetch time slots" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/v1/time-slots
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, slots, generateDefault } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // ถ้าต้องการสร้าง slots อัตโนมัติ
    if (generateDefault) {
      const dayOfWeek = new Date(date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const openTime = "08:00";
      const closeTime = isWeekend ? "16:00" : "20:00";
      const slotDuration = 60;

      const generatedSlots: { start: Date; end: Date }[] = [];

      let currentTime = createDateTime(date, openTime);
      const endTime = createDateTime(date, closeTime);

      while (currentTime < endTime) {
        const slotEnd = addMinutes(currentTime, slotDuration);
        if (slotEnd <= endTime) {
          generatedSlots.push({
            start: new Date(currentTime),
            end: slotEnd,
          });
        }
        currentTime = slotEnd;
      }

      const created = await prisma.timeSlot.createMany({
        data: generatedSlots.map((s) => ({
          time_slot_start_datetime: s.start,
          time_slot_end_datetime: s.end,
          time_slot_max_capacity: body.maxCapacity || 1,
          time_slot_status: "AVAILABLE",
        })),
        skipDuplicates: true,
      });

      return NextResponse.json({
        success: true,
        message: `Created ${created.count} time slots`,
        date,
      });
    }

    // ถ้าระบุ slots เอง
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "Slots array is required" },
        { status: 400 }
      );
    }

    const created = await prisma.timeSlot.createMany({
      data: slots.map(
        (s: { startTime: string; endTime: string; maxCapacity?: number }) => ({
          time_slot_start_datetime: createDateTime(date, s.startTime),
          time_slot_end_datetime: createDateTime(date, s.endTime),
          time_slot_max_capacity: s.maxCapacity || 1,
          time_slot_status: "AVAILABLE",
        })
      ),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: `Created ${created.count} time slots`,
      date,
    });
  } catch (error) {
    console.error("[POST /time-slots] Error:", error);
    return NextResponse.json(
      { error: "Failed to create time slots" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/v1/time-slots?date=YYYY-MM-DD
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    // ลบเฉพาะ slots ที่ไม่มี booking
    const deleted = await prisma.timeSlot.deleteMany({
      where: {
        time_slot_start_datetime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        bookingSlots: {
          none: {},
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} time slots`,
      date: dateStr,
    });
  } catch (error) {
    console.error("[DELETE /time-slots] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete time slots" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/v1/time-slots?date=YYYY-MM-DD&action=regenerate
// Force regenerate slots (สำหรับ Admin)
// ============================================
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const action = searchParams.get("action");

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (action === "regenerate") {
      const startOfDay = new Date(`${dateStr}T00:00:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59`);

      // ลบ slots ที่ไม่มี booking
      const deleted = await prisma.timeSlot.deleteMany({
        where: {
          time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
          bookingSlots: { none: {} },
        },
      });

      // Generate ใหม่
      const created = await generateDefaultSlots(dateStr);

      // นับ slots ใหม่
      const newCount = await prisma.timeSlot.count({
        where: {
          time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Regenerated slots for ${dateStr}`,
        deleted: deleted.count,
        created,
        total: newCount,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /time-slots] Error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate" },
      { status: 500 }
    );
  }
}