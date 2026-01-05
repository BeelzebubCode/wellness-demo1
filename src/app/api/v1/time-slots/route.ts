// src/app/api/v1/time-slots/route.ts
// ✅ Fixed: Uses TimeSlot model from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper: สร้าง datetime จาก date + time
function createDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

// Helper: เพิ่มนาที
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// GET /api/v1/time-slots?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const showAll = searchParams.get('all') === 'true';

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // ช่วงเวลาของวันที่ต้องการ
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    // ดึง time slots
    const whereClause: Record<string, unknown> = {
      time_slot_start_datetime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // ถ้าไม่ใช่ showAll ให้แสดงเฉพาะ AVAILABLE
    if (!showAll) {
      whereClause.time_slot_status = 'AVAILABLE';
    }

    const timeSlots = await prisma.timeSlot.findMany({
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
      orderBy: { time_slot_start_datetime: 'asc' },
    });

    // Format response
    const formattedSlots = timeSlots.map((slot) => {
      // นับ booking ที่ active
      const activeBookings = slot.bookingSlots.filter(
        (bs) => bs.booking.booking_status !== 'CANCELLED'
      ).length;

      const availableCount = Math.max(0, slot.time_slot_max_capacity - activeBookings);

      return {
        id: slot.time_slot_id,
        date: slot.time_slot_start_datetime.toISOString().split('T')[0],
        startTime: slot.time_slot_start_datetime.toTimeString().slice(0, 5),
        endTime: slot.time_slot_end_datetime.toTimeString().slice(0, 5),
        startDateTime: slot.time_slot_start_datetime.toISOString(),
        endDateTime: slot.time_slot_end_datetime.toISOString(),
        maxCapacity: slot.time_slot_max_capacity,
        bookedCount: activeBookings,
        availableCount,
        status: slot.time_slot_status,
        isAvailable: slot.time_slot_status === 'AVAILABLE' && availableCount > 0,
      };
    });

    return NextResponse.json({
      success: true,
      date: dateStr,
      slots: formattedSlots,
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
}

// POST /api/v1/time-slots
// สร้าง time slots สำหรับวันที่กำหนด
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, slots, generateDefault } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // ถ้าต้องการสร้าง slots อัตโนมัติ
    if (generateDefault) {
      const { openTime = '09:00', closeTime = '16:00', slotDuration = 60 } = body;

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

      // สร้าง time slots
      const created = await prisma.timeSlot.createMany({
        data: generatedSlots.map((s) => ({
          time_slot_start_datetime: s.start,
          time_slot_end_datetime: s.end,
          time_slot_max_capacity: body.maxCapacity || 1,
          time_slot_status: 'AVAILABLE',
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
        { error: 'Slots array is required' },
        { status: 400 }
      );
    }

    const created = await prisma.timeSlot.createMany({
      data: slots.map((s: { startTime: string; endTime: string; maxCapacity?: number }) => ({
        time_slot_start_datetime: createDateTime(date, s.startTime),
        time_slot_end_datetime: createDateTime(date, s.endTime),
        time_slot_max_capacity: s.maxCapacity || 1,
        time_slot_status: 'AVAILABLE',
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: `Created ${created.count} time slots`,
      date,
    });
  } catch (error) {
    console.error('Error creating time slots:', error);
    return NextResponse.json(
      { error: 'Failed to create time slots' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/time-slots?date=YYYY-MM-DD
// ลบ time slots ทั้งวัน (เฉพาะที่ไม่มี booking)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
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
    console.error('Error deleting time slots:', error);
    return NextResponse.json(
      { error: 'Failed to delete time slots' },
      { status: 500 }
    );
  }
}