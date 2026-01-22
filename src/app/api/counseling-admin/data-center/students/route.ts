// src/app/api/admin/data-center/students/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;

  const search = (searchParams.get("search") ?? "").trim();
  const facultyId = searchParams.get("facultyId");
  const departmentId = searchParams.get("departmentId");

  try {
    const AND: any[] = [];

    // -----------------------
    // ✅ SEARCH (fix แบบชัวร์)
    // -----------------------
    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);

      // 1) หา student_id ที่ match จาก student_profile ก่อน
      const profileWhere =
        tokens.length === 1
          ? {
              OR: [
                { student_first_name: { contains: tokens[0] } },
                { student_last_name: { contains: tokens[0] } },
                { student_email: { contains: tokens[0] } },
              ],
            }
          : {
              OR: [
                // first last
                {
                  AND: [
                    { student_first_name: { contains: tokens[0] } },
                    { student_last_name: { contains: tokens.slice(1).join(" ") } },
                  ],
                },
                // last first (สลับ)
                {
                  AND: [
                    { student_first_name: { contains: tokens.slice(1).join(" ") } },
                    { student_last_name: { contains: tokens[0] } },
                  ],
                },
                // เผื่อพิมพ์เป็นคำเดียวแต่มี space แปลก ๆ
                { student_first_name: { contains: search } },
                { student_last_name: { contains: search } },
                { student_email: { contains: search } },
              ],
            };

      const matchedProfiles = await prisma.studentProfile.findMany({
        where: profileWhere,
        select: { student_id: true },
        take: 500, // กัน query หนักเกิน
      });

      const profileIds = matchedProfiles.map((x) => x.student_id);

      // 2) เอา profileIds + student_code มาทำ OR ใน student
      AND.push({
        OR: [
          { student_code: { contains: search } },
          ...(profileIds.length > 0 ? [{ student_id: { in: profileIds } }] : []),
        ],
      });
    }

    // -----------------------
    // ✅ Academic filters
    // -----------------------
    const academicWhere: any = {};
    if (facultyId) academicWhere.faculty_id = Number(facultyId);
    if (departmentId) academicWhere.department_id = Number(departmentId);

    if (Object.keys(academicWhere).length > 0) {
      AND.push({ academic: { is: academicWhere } });
    }

    const where = AND.length ? { AND } : {};

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { student_id: "desc" },
        include: {
          profile: true,
          academic: { include: { faculty: true, department: true } },
          bookings: {
            select: {
              booking_id: true,
              booking_status: true,
              booking_created_at: true,
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    const data = students.map((s) => {
      const bookings = s.bookings ?? [];
      const completedCount = bookings.filter((b) => b.booking_status === "COMPLETED").length;
      const cancelledCount = bookings.filter((b) => b.booking_status === "CANCELLED").length;

      const lastBooking = [...bookings].sort(
        (a, b) =>
          new Date(b.booking_created_at).getTime() - new Date(a.booking_created_at).getTime()
      )[0];

      return {
        id: s.student_id,
        code: s.student_code,
        name:
          `${s.profile?.student_first_name ?? ""} ${s.profile?.student_last_name ?? ""}`.trim() ||
          "ไม่ระบุ",
        email: s.profile?.student_email ?? null,
        phone: s.profile?.student_phone_number ?? null,
        faculty: s.academic?.faculty?.faculty_name_th ?? null,
        department: s.academic?.department?.department_name_th ?? null,
        year: s.academic?.student_admit_academic_year
          ? new Date().getFullYear() - s.academic.student_admit_academic_year + 1 + 543
          : null,
        degree: s.academic?.student_degree ?? null,
        bookingCount: bookings.length,
        completedCount,
        cancelledCount,
        noShowCount: 0,
        lastBookingDate: lastBooking ? lastBooking.booking_created_at.toISOString().split("T")[0] : null,
      };
    });

    return NextResponse.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /data-center/students] Error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
