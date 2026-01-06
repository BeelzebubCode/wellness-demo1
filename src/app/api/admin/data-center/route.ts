import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const skip = (page - 1) * limit;

  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = {};

  if (status && status !== 'ALL') {
    where.booking_status = status;
  }

  if (search) {
    where.student = {
      profile: {
        OR: [
          { student_first_name: { contains: search } },
          { student_last_name: { contains: search } },
          { student_email: { contains: search } },
        ],
      },
    };
  }

  if (startDate || endDate) {
    where.bookingSlots = {
      some: {
        timeSlot: {
          time_slot_start_datetime: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
          },
        },
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { booking_created_at: 'desc' },
      include: {
        student: { include: { profile: true } },
        consultant: { include: { profile: true } },
        problemCategory: true,
        bookingSlots: { include: { timeSlot: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({
    data: items.map(b => ({
      id: b.booking_id,
      status: b.booking_status,
      meetingUrl: null,
      timeSlot: {
        startTime: b.bookingSlots[0]?.timeSlot.time_slot_start_datetime,
        endTime: b.bookingSlots[0]?.timeSlot.time_slot_end_datetime,
      },
      student: {
        name: `${b.student.profile?.student_first_name ?? ''} ${b.student.profile?.student_last_name ?? ''}`.trim(),
        nickname: b.student.profile?.student_nickname,
        email: b.student.profile?.student_email,
      },
      consultant: {
        name: b.consultant
          ? `${b.consultant.profile?.consultant_first_name} ${b.consultant.profile?.consultant_last_name}`
          : 'ยังไม่มอบหมาย',
      },
      problemCategory: {
        name: b.problemCategory.problem_category_name_th,
      },
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
