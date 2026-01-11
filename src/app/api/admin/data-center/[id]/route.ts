// src/app/api/admin/data-center/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TZ = "Asia/Bangkok";

function formatDateTime(d?: Date | null) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bookingId = Number(params.id);
  if (Number.isNaN(bookingId)) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    include: {
      student: { include: { profile: true } },
      consultant: { include: { profile: true } },
      problemCategory: true,
      bookingSlots: { include: { timeSlot: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const slot = booking.bookingSlots[0]?.timeSlot;

  return NextResponse.json({
    id: booking.booking_id,
    status: booking.booking_status,
    problemType: booking.problemCategory.problem_category_name_th,
    createdAt: formatDateTime(booking.booking_created_at),

    student: {
      name: `${booking.student.profile?.student_first_name ?? ""} ${booking.student.profile?.student_last_name ?? ""}`,
      code: booking.student.student_code,
      email: booking.student.profile?.student_email,
    },

    consultant: booking.consultant
      ? {
          name: `${booking.consultant.profile?.consultant_first_name ?? ""} ${booking.consultant.profile?.consultant_last_name ?? ""}`,
          email: booking.consultant.profile?.consultant_email,
        }
      : null,

    appointment: {
      start: formatDateTime(slot?.time_slot_start_datetime),
      end: formatDateTime(slot?.time_slot_end_datetime),
    },
  });
}
