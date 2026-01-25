// src/app/api/admin/data-center/students/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TZ = "Asia/Bangkok";

function formatDate(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
}

function formatTime(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = Number(params.id);

  if (isNaN(studentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
      include: {
        profile: true,
        academic: {
          include: {
            faculty: true,
            department: true,
            advisor: true,
          },
        },
        addresses: {
          include: { province: true },
        },
        bookings: {
          orderBy: { booking_created_at: "desc" },
          take: 20,
          include: {
            problemCategory: true,
            consultant: { include: { profile: true } },
            timeSlot: true, // ✅ relation จริงใน Booking
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const bookings = student.bookings;
    const completedCount = bookings.filter(b => b.booking_status === "COMPLETED").length;
    const cancelledCount = bookings.filter(b => b.booking_status === "CANCELLED").length;

    return NextResponse.json({
      id: student.student_id,
      code: student.student_code,
      name: `${student.profile?.student_first_name ?? ""} ${student.profile?.student_last_name ?? ""}`.trim(),
      email: student.profile?.student_email,
      phone: student.profile?.student_phone_number,
      faculty: student.academic?.faculty?.faculty_name_th,
      department: student.academic?.department?.department_name_th,
      year: student.academic?.student_admit_academic_year,
      degree: student.academic?.student_degree,
      advisor: student.academic?.advisor
        ? `${student.academic.advisor.advisor_prefix ?? ""} ${student.academic.advisor.advisor_first_name} ${student.academic.advisor.advisor_last_name}`.trim()
        : null,
      bookingCount: bookings.length,
      completedCount,
      cancelledCount,
      noShowCount: 0,
      lastBookingDate: bookings[0]?.booking_created_at.toISOString().split("T")[0] ?? null,

      addresses: student.addresses.map((a) => ({
        type: a.student_address_type,
        detail: `${a.student_address_detail ?? ""} ${a.student_address_sub_district ?? ""} ${a.student_address_district ?? ""} ${a.province.province_name_th} ${a.student_address_postal_code}`.trim(),
        province: a.province.province_name_th,
      })),

      bookings: bookings.map((b) => {
        const slot = b.timeSlot;
        return {
          id: b.booking_id,
          date: formatDate(slot?.time_slot_start_datetime ?? null) ?? "-",
          time: slot
            ? `${formatTime(slot.time_slot_start_datetime)} - ${formatTime(slot.time_slot_end_datetime)}`
            : "-",
          status: b.booking_status,
          problemType: b.problemCategory.problem_category_name_th,
          consultantName: b.consultant
            ? `${b.consultant.profile?.consultant_first_name ?? ""} ${b.consultant.profile?.consultant_last_name ?? ""}`.trim()
            : "ยังไม่มอบหมาย",
        };
      }),
    });
  } catch (error) {
    console.error("[GET /data-center/students/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}