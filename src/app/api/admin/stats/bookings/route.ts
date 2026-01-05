// src/app/api/admin/stats/bookings/route.ts
// ✅ Fixed: Uses Booking, Student, Consultant models from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { BookingStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const faculty = searchParams.get('faculty');
    const problemType = searchParams.get('problemType');
    const status = searchParams.get('status') as BookingStatus | null;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const consultantId = searchParams.get('consultantId');

    const where: Record<string, unknown> = {};

    // Search by student code or name
    if (search) {
      where.OR = [
        { student: { student_code: { contains: search } } },
        { student: { profile: { student_first_name: { contains: search } } } },
        { student: { profile: { student_last_name: { contains: search } } } },
      ];
    }

    // Faculty filter
    if (faculty) {
      where.student = {
        ...(where.student as Record<string, unknown> || {}),
        academic: { faculty: { faculty_name_th: faculty } },
      };
    }

    // Problem type filter
    if (problemType && problemType !== 'ทั้งหมด') {
      where.problemCategory = {
        problem_category_name_th: { contains: problemType },
      };
    }

    // Status filter
    if (status) {
      where.booking_status = status;
    }

    // Consultant filter
    if (consultantId) {
      where.consultant_id = parseInt(consultantId);
    }

    // Date range filter (based on booking creation or time slot)
    // For simplicity, we filter by booking_created_at here
    if (dateFrom || dateTo) {
      where.booking_created_at = {};
      if (dateFrom) {
        (where.booking_created_at as Record<string, unknown>).gte = new Date(`${dateFrom}T00:00:00`);
      }
      if (dateTo) {
        (where.booking_created_at as Record<string, unknown>).lte = new Date(`${dateTo}T23:59:59`);
      }
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
      },
      orderBy: { booking_created_at: 'desc' },
    });

    // Summary
    const summary = {
      total: bookings.length,
      pendingAssignment: bookings.filter(
        (b) => b.booking_status === 'PENDING_ASSIGNMENT'
      ).length,
      assigned: bookings.filter((b) => b.booking_status === 'ASSIGNED').length,
      inProgress: bookings.filter((b) => b.booking_status === 'IN_PROGRESS')
        .length,
      completed: bookings.filter((b) => b.booking_status === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.booking_status === 'CANCELLED').length,
    };

    // Format bookings
    const mapped = bookings.map((b) => {
      const timeSlot = b.bookingSlots[0]?.timeSlot;
      const studentProfile = b.student.profile;
      const consultantProfile = b.consultant?.profile;

      return {
        id: b.booking_id,
        studentId: b.student.student_code,
        studentName: studentProfile
          ? `${studentProfile.student_first_name} ${studentProfile.student_last_name}`
          : null,
        faculty: b.student.academic?.faculty.faculty_name_th ?? null,
        department: b.student.academic?.department.department_name_th ?? null,
        problemType: b.problemCategory.problem_category_name_th,
        date: timeSlot?.time_slot_start_datetime.toISOString().split('T')[0] ?? null,
        startTime: timeSlot?.time_slot_start_datetime.toTimeString().slice(0, 5) ?? null,
        endTime: timeSlot?.time_slot_end_datetime.toTimeString().slice(0, 5) ?? null,
        status: b.booking_status,
        consultantName: consultantProfile
          ? `${consultantProfile.consultant_first_name} ${consultantProfile.consultant_last_name}`
          : null,
        createdAt: b.booking_created_at.toISOString(),
      };
    });

    return NextResponse.json({ summary, bookings: mapped });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking stats' },
      { status: 500 }
    );
  }
}