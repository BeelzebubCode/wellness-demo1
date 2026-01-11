// src/app/api/admin/data-center/bookings/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TZ = "Asia/Bangkok";

function formatDateYMD(d?: Date | null) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
}

function formatTimeHM(d?: Date | null) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const problemCategoryId = searchParams.get("problemCategoryId");

  try {
    const where: any = {};

    if (status && status !== "ALL") {
      where.booking_status = status;
    }

    if (problemCategoryId) {
      where.problem_category_id = Number(problemCategoryId);
    }

    if (search) {
      where.OR = [
        { student: { student_code: { contains: search } } },
        { student: { profile: { student_first_name: { contains: search } } } },
        { student: { profile: { student_last_name: { contains: search } } } },
        { consultant: { profile: { consultant_first_name: { contains: search } } } },
        { consultant: { profile: { consultant_last_name: { contains: search } } } },
      ];
    }

    if (startDate || endDate) {
      where.bookingSlots = {
        some: {
          timeSlot: {
            time_slot_start_datetime: {
              ...(startDate && { gte: new Date(`${startDate}T00:00:00`) }),
              ...(endDate && { lte: new Date(`${endDate}T23:59:59.999`) }),
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
        orderBy: { booking_created_at: "desc" },
        include: {
          student: { include: { profile: true } },
          consultant: { include: { profile: true } },
          problemCategory: true,
          bookingSlots: { include: { timeSlot: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const data = items.map((b) => {
      const slot = b.bookingSlots[0]?.timeSlot ?? null;
      const start = slot?.time_slot_start_datetime ?? null;
      const end = slot?.time_slot_end_datetime ?? null;

      return {
        id: b.booking_id,
        status: b.booking_status,
        problemType: b.problemCategory.problem_category_name_th,
        studentName: `${b.student.profile?.student_first_name ?? ""} ${b.student.profile?.student_last_name ?? ""}`.trim() || "ไม่ระบุ",
        studentCode: b.student.student_code ?? "-",
        consultantName: b.consultant
          ? `${b.consultant.profile?.consultant_first_name ?? ""} ${b.consultant.profile?.consultant_last_name ?? ""}`.trim()
          : "ยังไม่มอบหมาย",
        date: formatDateYMD(start),
        timeSlot: `${formatTimeHM(start)} - ${formatTimeHM(end)}`,
        createdAt: b.booking_created_at.toISOString(),
      };
    });

    return NextResponse.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /data-center/bookings] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}