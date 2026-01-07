import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { BookingStatus } from '@prisma/client';
import { getAccountFromRequest } from '@/lib/jwt';

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
    const account = await getAccountFromRequest(request);

    if (!account || account.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!account.studentId) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const timeSlotId = Number(body.timeSlotId);
    const problemCategoryId = Number(body.problemCategoryId);
    const detailText = body.detailText?.toString() || null;

    if (!timeSlotId || Number.isNaN(timeSlotId)) {
      return NextResponse.json({ error: 'timeSlotId ไม่ถูกต้อง' }, { status: 400 });
    }

    if (!problemCategoryId || Number.isNaN(problemCategoryId)) {
      return NextResponse.json(
        { error: 'problemCategoryId ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const studentId = account.studentId;

    // 🔍 เช็กว่ามี booking ค้างอยู่ไหม
    const existing = await prisma.booking.findFirst({
      where: {
        student_id: studentId,
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
          student_id: studentId,
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

