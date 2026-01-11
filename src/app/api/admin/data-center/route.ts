// src/app/api/admin/data-center/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TZ = "Asia/Bangkok";

function formatDateYMD(d?: Date | null) {
  if (!d) return "-";
  // sv-SE จะออกเป็น YYYY-MM-DD
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
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

  const where: any = {};

  if (status && status !== "ALL") {
    where.booking_status = status;
  }

  if (search) {
    // ค้นจากชื่อ/นามสกุล/อีเมลนิสิต (แบบเดิมของมึงโอเค)
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

  return NextResponse.json({
    data: items.map((b) => {
      const slot = b.bookingSlots[0]?.timeSlot ?? null;
      const start = slot?.time_slot_start_datetime ?? null;
      const end = slot?.time_slot_end_datetime ?? null;

      const studentName = `${b.student.profile?.student_first_name ?? ""} ${b.student.profile?.student_last_name ?? ""}`.trim();

      const consultantName = b.consultant
        ? `${b.consultant.profile?.consultant_first_name ?? ""} ${b.consultant.profile?.consultant_last_name ?? ""}`.trim()
        : "ยังไม่มอบหมาย";

      return {
        // ✅ ให้ shape ตรงกับ table ที่หน้า page.tsx ใช้อยู่
        id: b.booking_id,
        status: b.booking_status,
        problemType: b.problemCategory.problem_category_name_th,
        studentName: studentName || "ไม่ระบุชื่อ",
        studentId: b.student.student_code ?? "-", // ถ้ามึงอยากเป็นรหัสนิสิต
        consultantName: consultantName || "ยังไม่มอบหมาย",

        // ✅ ส่งเป็น string display-ready (แก้ runtime error แน่นอน)
        date: formatDateYMD(start),
        timeSlot: `${formatTimeHM(start)} - ${formatTimeHM(end)}`,

        // (optional เผื่อใช้ต่อ)
        meetingUrl: null,
      };
    }),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
