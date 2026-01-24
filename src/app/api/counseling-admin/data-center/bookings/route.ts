// src/app/api/admin/data-center/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

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

  const search = (searchParams.get("search") ?? "").trim();
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const problemCategoryId = searchParams.get("problemCategoryId");

  try {
    // ✅ ดึง tenant/มหาลัยที่ active ของ user
    const { activeUniversityId } = await requireTenant(req);

    const where: any = {};

    // ✅ ล็อกให้เห็นเฉพาะ booking ของมหาลัยตัวเอง
    where.university_id = activeUniversityId;

    if (status && status !== "ALL") {
      where.booking_status = status;
    }

    if (problemCategoryId) {
      where.problem_category_id = Number(problemCategoryId);
    }

    if (search) {
      where.OR = [
        { student: { student_code: { contains: search, mode: "insensitive" } } },
        { student: { profile: { student_first_name: { contains: search, mode: "insensitive" } } } },
        { student: { profile: { student_last_name: { contains: search, mode: "insensitive" } } } },
        { consultant: { profile: { consultant_first_name: { contains: search, mode: "insensitive" } } } },
        { consultant: { profile: { consultant_last_name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    if (startDate || endDate) {
      where.timeSlot = {
        time_slot_start_datetime: {
          ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
          ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
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
          timeSlot: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const data = items.map((b) => {
      const start = b.timeSlot?.time_slot_start_datetime ?? null;
      const end = b.timeSlot?.time_slot_end_datetime ?? null;

      return {
        id: b.booking_id,
        status: b.booking_status,
        problemType: b.problemCategory.problem_category_name_th,
        studentName:
          `${b.student.profile?.student_first_name ?? ""} ${b.student.profile?.student_last_name ?? ""}`.trim() ||
          "ไม่ระบุ",
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
  } catch (error: any) {
    console.error("[GET /data-center/bookings] Error:", error);
    const status = error?.status ?? 500;
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch bookings" },
      { status }
    );
  }
}
