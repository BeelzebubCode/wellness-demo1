import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { BookingStatus } from '@prisma/client';

/* =========================
   GET /api/v1/bookings
   ========================= */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as BookingStatus | null;
    const studentUsername = searchParams.get('student'); // account_username
    const consultantId = searchParams.get('consultantId');

    const where: any = {};

    if (status) {
      where.booking_status = status;
    }

    if (consultantId) {
      where.consultant_id = Number(consultantId);
    }

    if (studentUsername) {
      const student = await prisma.student.findFirst({
        where: {
          account: {
            account_username: studentUsername,
          },
        },
      });

      if (!student) {
        return NextResponse.json({ success: true, bookings: [] });
      }

      where.student_id = student.student_id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          include: {
            profile: true,
            academic: {
              include: {
                faculty: true,
                department: true,
              },
            },
            account: true,
          },
        },
        consultant: {
          include: { profile: true },
        },
        problemCategory: true,
        bookingSlots: {
          include: { timeSlot: true },
        },
        outcome: true,
        cancellation: true,
      },
      orderBy: { booking_created_at: 'desc' },
    });

    const formatted = bookings.map((b) => {
      const slot = b.bookingSlots[0]?.timeSlot;
      const studentProfile = b.student.profile;
      const consultantProfile = b.consultant?.profile;

      return {
        id: b.booking_id,
        status: b.booking_status,
        problemType: b.problemCategory.problem_category_name_th,
        problemCategoryCode: b.problemCategory.problem_category_code,
        detailText: b.booking_detail_text,
        createdAt: b.booking_created_at.toISOString(),

        date: slot?.time_slot_start_datetime.toISOString().split('T')[0] ?? null,
        startTime: slot?.time_slot_start_datetime.toTimeString().slice(0, 5) ?? null,
        endTime: slot?.time_slot_end_datetime.toTimeString().slice(0, 5) ?? null,

        student: {
          id: b.student.student_id,
          username: b.student.account.account_username,
          name: studentProfile
            ? `${studentProfile.student_first_name} ${studentProfile.student_last_name}`
            : null,
          faculty: b.student.academic?.faculty.faculty_name_th ?? null,
          department: b.student.academic?.department.department_name_th ?? null,
        },

        consultant: consultantProfile
          ? {
              id: b.consultant_id,
              name: `${consultantProfile.consultant_first_name} ${consultantProfile.consultant_last_name}`,
            }
          : null,

        outcome: b.outcome ?? null,
        cancellation: b.cancellation ?? null,
      };
    });

    return NextResponse.json({ success: true, bookings: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

/* =========================
   POST /api/v1/bookings
   ========================= */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: 'Body ต้องเป็น JSON' },
        { status: 400 }
      );
    }

    const studentUsername = body.studentCode?.toString().trim(); // account_username
    const timeSlotId = Number(body.timeSlotId);
    const problemCategoryId = Number(body.problemCategoryId);
    const detailText = body.detailText?.toString() || null;

    if (!studentUsername) {
      return NextResponse.json(
        { error: 'ต้องระบุ studentCode (account_username)' },
        { status: 400 }
      );
    }

    if (!timeSlotId || Number.isNaN(timeSlotId)) {
      return NextResponse.json(
        { error: 'timeSlotId ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (!problemCategoryId || Number.isNaN(problemCategoryId)) {
      return NextResponse.json(
        { error: 'problemCategoryId ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    /* หา student จาก account_username */
    const student = await prisma.student.findFirst({
      where: {
        account: {
          account_username: studentUsername,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลนิสิต' },
        { status: 404 }
      );
    }

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { time_slot_id: timeSlotId },
      include: {
        bookingSlots: {
          include: { booking: true },
        },
      },
    });

    if (!timeSlot || timeSlot.time_slot_status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'ช่วงเวลานี้ไม่ว่าง' },
        { status: 400 }
      );
    }

    if (timeSlot.bookingSlots.length >= timeSlot.time_slot_max_capacity) {
      return NextResponse.json(
        { error: 'ช่วงเวลานี้เต็มแล้ว' },
        { status: 400 }
      );
    }

    const existing = await prisma.booking.findFirst({
      where: {
        student_id: student.student_id,
        booking_status: {
          in: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'มีการจองที่ยังไม่เสร็จสิ้นอยู่แล้ว' },
        { status: 400 }
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          student_id: student.student_id,
          problem_category_id: problemCategoryId,
          booking_detail_text: detailText,
          booking_status: 'PENDING_ASSIGNMENT',
        },
      });

      await tx.bookingSlot.create({
        data: {
          booking_id: b.booking_id,
          time_slot_id: timeSlotId,
        },
      });

      if (
        timeSlot.bookingSlots.length + 1 >=
        timeSlot.time_slot_max_capacity
      ) {
        await tx.timeSlot.update({
          where: { time_slot_id: timeSlotId },
          data: { time_slot_status: 'BOOKED' },
        });
      }

      return b;
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.booking_id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
