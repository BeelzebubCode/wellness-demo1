// src/app/api/v1/bookings/route.ts
// ✅ Fixed: Uses Booking, Student, Account models from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { BookingStatus } from '@prisma/client';

// GET /api/v1/bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') as BookingStatus | null;
    const studentId = searchParams.get('studentId');
    const consultantId = searchParams.get('consultantId');
    const lineUserId = searchParams.get('lineUserId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    // Status filter
    if (status) {
      where.booking_status = status;
    }

    // Student filter
    if (studentId) {
      where.student_id = parseInt(studentId);
    }

    // Consultant filter
    if (consultantId) {
      where.consultant_id = parseInt(consultantId);
    }

    // LINE User ID filter - ต้องหา student จาก account ก่อน
    if (lineUserId) {
      const account = await prisma.account.findUnique({
        where: { account_line_id: lineUserId },
        include: { student: true },
      });
      
      if (!account?.student) {
        return NextResponse.json({ success: true, bookings: [] });
      }
      where.student_id = account.student.student_id;
    }

    // Date filter - ใช้ time slot
    // Note: ต้อง join กับ booking_slot และ time_slot

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
          include: {
            profile: true,
          },
        },
        problemCategory: true,
        bookingSlots: {
          include: {
            timeSlot: true,
          },
        },
        outcome: true,
        cancellation: true,
      },
      orderBy: { booking_created_at: 'desc' },
    });

    // Format response
    const formattedBookings = bookings.map((b) => {
      const timeSlot = b.bookingSlots[0]?.timeSlot;
      const studentProfile = b.student.profile;
      const consultantProfile = b.consultant?.profile;

      return {
        id: b.booking_id,
        status: b.booking_status,
        problemType: b.problemCategory.problem_category_name_th,
        problemCategoryCode: b.problemCategory.problem_category_code,
        detailText: b.booking_detail_text,
        createdAt: b.booking_created_at.toISOString(),
        updatedAt: b.booking_updated_at.toISOString(),

        // Time info
        date: timeSlot?.time_slot_start_datetime.toISOString().split('T')[0] ?? null,
        startTime: timeSlot?.time_slot_start_datetime.toTimeString().slice(0, 5) ?? null,
        endTime: timeSlot?.time_slot_end_datetime.toTimeString().slice(0, 5) ?? null,

        // Student info
        studentId: b.student_id,
        studentCode: b.student.student_code,
        studentName: studentProfile
          ? `${studentProfile.student_first_name} ${studentProfile.student_last_name}`
          : null,
        studentFaculty: b.student.academic?.faculty.faculty_name_th ?? null,
        studentDepartment: b.student.academic?.department.department_name_th ?? null,
        lineUserId: b.student.account.account_line_id,

        // Consultant info
        consultantId: b.consultant_id,
        consultantName: consultantProfile
          ? `${consultantProfile.consultant_first_name} ${consultantProfile.consultant_last_name}`
          : null,

        // Outcome/Cancellation
        outcome: b.outcome
          ? {
              note: b.outcome.booking_outcome_consultant_note,
              nextStep: b.outcome.booking_outcome_next_step,
              riskLevel: b.outcome.booking_outcome_risk_level,
              recordedAt: b.outcome.booking_outcome_recorded_at.toISOString(),
            }
          : null,
        cancellation: b.cancellation
          ? {
              reason: b.cancellation.booking_cancellation_reason,
              cancelledAt: b.cancellation.booking_cancellation_cancelled_at.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, bookings: formattedBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/v1/bookings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lineUserId,
      studentCode,
      timeSlotId,
      problemCategoryId,
      problemCategoryCode,
      detailText,
    } = body;

    // Validate required fields
    if (!lineUserId && !studentCode) {
      return NextResponse.json(
        { error: 'ต้องระบุ lineUserId หรือ studentCode' },
        { status: 400 }
      );
    }

    if (!timeSlotId) {
      return NextResponse.json(
        { error: 'ต้องระบุ timeSlotId' },
        { status: 400 }
      );
    }

    if (!problemCategoryId && !problemCategoryCode) {
      return NextResponse.json(
        { error: 'ต้องระบุประเภทปัญหา' },
        { status: 400 }
      );
    }

    // 1. หา Student จาก LINE ID หรือ Student Code
    let student;
    
    if (lineUserId) {
      const account = await prisma.account.findUnique({
        where: { account_line_id: lineUserId },
        include: { student: true },
      });
      student = account?.student;
    } else if (studentCode) {
      student = await prisma.student.findUnique({
        where: { student_code: studentCode },
      });
    }

    if (!student) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลนิสิต' },
        { status: 404 }
      );
    }

    // 2. หา Problem Category
    let problemCategory;
    if (problemCategoryId) {
      problemCategory = await prisma.problemCategory.findUnique({
        where: { problem_category_id: problemCategoryId },
      });
    } else if (problemCategoryCode) {
      problemCategory = await prisma.problemCategory.findUnique({
        where: { problem_category_code: problemCategoryCode },
      });
    }

    if (!problemCategory) {
      return NextResponse.json(
        { error: 'ไม่พบประเภทปัญหาที่ระบุ' },
        { status: 404 }
      );
    }

    // 3. ตรวจสอบ Time Slot
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { time_slot_id: timeSlotId },
      include: {
        bookingSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'ไม่พบช่วงเวลาที่ระบุ' },
        { status: 404 }
      );
    }

    if (timeSlot.time_slot_status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'ช่วงเวลานี้ไม่ว่าง' },
        { status: 400 }
      );
    }

    // ตรวจสอบจำนวน booking ที่มีอยู่
    const activeBookings = timeSlot.bookingSlots.filter(
      (bs) => bs.booking.booking_status !== 'CANCELLED'
    );

    if (activeBookings.length >= timeSlot.time_slot_max_capacity) {
      return NextResponse.json(
        { error: 'ช่วงเวลานี้เต็มแล้ว' },
        { status: 400 }
      );
    }

    // 4. ตรวจสอบว่านิสิตมี booking ที่ active อยู่หรือไม่
    const existingBooking = await prisma.booking.findFirst({
      where: {
        student_id: student.student_id,
        booking_status: {
          in: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'คุณมีการจองที่รอดำเนินการอยู่แล้ว กรุณายกเลิกก่อนจองใหม่' },
        { status: 400 }
      );
    }

    // 5. สร้าง Booking และ BookingSlot พร้อมกัน
    const booking = await prisma.$transaction(async (tx) => {
      // สร้าง Booking
      const newBooking = await tx.booking.create({
        data: {
          student_id: student.student_id,
          problem_category_id: problemCategory.problem_category_id,
          booking_detail_text: detailText,
          booking_status: 'PENDING_ASSIGNMENT',
        },
      });

      // สร้าง BookingSlot
      await tx.bookingSlot.create({
        data: {
          booking_id: newBooking.booking_id,
          time_slot_id: timeSlotId,
        },
      });

      // อัพเดท TimeSlot status ถ้าเต็ม
      const updatedBookingCount = activeBookings.length + 1;
      if (updatedBookingCount >= timeSlot.time_slot_max_capacity) {
        await tx.timeSlot.update({
          where: { time_slot_id: timeSlotId },
          data: { time_slot_status: 'BOOKED' },
        });
      }

      return newBooking;
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.booking_id,
        status: booking.booking_status,
        createdAt: booking.booking_created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}