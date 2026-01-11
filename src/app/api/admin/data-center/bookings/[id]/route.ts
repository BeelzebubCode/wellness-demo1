// src/app/api/admin/data-center/bookings/[id]/route.ts

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

  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
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
            organization: true,
          },
        },
        problemCategory: true,
        bookingSlots: { include: { timeSlot: true } },
        outcome: true,
        cancellation: {
          include: {
            cancelledBy: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const slot = booking.bookingSlots[0]?.timeSlot ?? null;
    const start = slot?.time_slot_start_datetime ?? null;
    const end = slot?.time_slot_end_datetime ?? null;

    return NextResponse.json({
      id: booking.booking_id,
      status: booking.booking_status,
      problemType: booking.problemCategory.problem_category_name_th,
      detailText: booking.booking_detail_text,
      date: formatDateYMD(start),
      timeSlot: `${formatTimeHM(start)} - ${formatTimeHM(end)}`,
      createdAt: formatDateTime(booking.booking_created_at),

      student: {
        id: booking.student.student_id,
        code: booking.student.student_code,
        name: `${booking.student.profile?.student_first_name ?? ""} ${booking.student.profile?.student_last_name ?? ""}`.trim(),
        email: booking.student.profile?.student_email,
        phone: booking.student.profile?.student_phone_number,
        faculty: booking.student.academic?.faculty?.faculty_name_th,
        department: booking.student.academic?.department?.department_name_th,
      },

      consultant: booking.consultant
        ? {
            id: booking.consultant.consultant_id,
            name: `${booking.consultant.profile?.consultant_first_name ?? ""} ${booking.consultant.profile?.consultant_last_name ?? ""}`.trim(),
            email: booking.consultant.profile?.consultant_email,
            phone: booking.consultant.profile?.consultant_phone_number,
            organization: booking.consultant.organization.organization_name,
          }
        : null,

      outcome: booking.outcome
        ? {
            note: booking.outcome.booking_outcome_consultant_note,
            nextStep: booking.outcome.booking_outcome_next_step,
            riskLevel: booking.outcome.booking_outcome_risk_level,
            recordedAt: formatDateTime(booking.outcome.booking_outcome_recorded_at),
          }
        : null,

      cancellation: booking.cancellation
        ? {
            reason: booking.cancellation.booking_cancellation_reason,
            cancelledBy: booking.cancellation.cancelledBy.account_username,
            cancelledAt: formatDateTime(booking.cancellation.booking_cancellation_cancelled_at),
          }
        : null,
    });
  } catch (error) {
    console.error("[GET /data-center/bookings/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}