// src/services/booking/handlers/getBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { AccountRole } from "@prisma/client";

function isAdminRole(role: AccountRole) {
  return (
    role === "HEAD_CONSULTANT" || role === "SUPER_ADMIN" || role === "RECTOR"
  );
}

export async function handleGetBooking(
  ctx: AccountContext & { activeUniversityId?: number },
  bookingIdRaw: string,
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json(
      { error: "activeUniversityId missing" },
      { status: 400 },
    );
  }

  // ✅ tenant guard ตั้งแต่ต้น
  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  // ✅ Booking ใช้ composite key
  const booking = await prisma.booking.findUnique({
    where: {
      university_id_booking_id: {
        university_id: activeUniversityId,
        booking_id: bookingId,
      },
    },
    include: {
      student: {
        include: {
          profile: true,
          academic: { include: { faculty: true, department: true } },
        },
      },
      consultant: { include: { profile: true } },
      problemCategory: true,
      timeSlot: true,
      assignments: {
        include: {
          assignedBy: true,
          consultant: { include: { profile: true } },
        },
        orderBy: { assigned_at: "desc" },
      },
      outcome: true,
      cancellation: { include: { cancelledBy: true } },
      feedback: {
        include: {
          ratings: { include: { criterion: true } },
          comment: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  // ✅ role-based view guard
  const role = ctx.role as AccountRole;

  if (role === "STUDENT") {
    const studentId = (ctx as any).studentId as number | undefined;
    if (!studentId || booking.student_id !== studentId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
  } else if (role === "CONSULTANT") {
    const consultantId = (ctx as any).consultantId as number | undefined;
    if (!consultantId || booking.consultant_id !== consultantId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
  } else if (!isAdminRole(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const timeSlot = booking.timeSlot;
  const sp = booking.student.profile; // StudentProfile | null
  const cp = booking.consultant?.profile;

  const formattedBooking = {
    id: booking.booking_id,
    status: booking.booking_status,

    problemType: booking.problemCategory.problem_category_name_th,
    problemCategoryId: booking.problem_category_id,
    problemCategoryCode: booking.problemCategory.problem_category_code,

    detailText: booking.booking_detail_text,

    createdAt: booking.booking_created_at.toISOString(),
    updatedAt: booking.booking_updated_at.toISOString(),

    date: timeSlot?.time_slot_start_datetime
      ? timeSlot.time_slot_start_datetime.toISOString().split("T")[0]
      : null,
    startTime: timeSlot?.time_slot_start_datetime
      ? timeSlot.time_slot_start_datetime.toTimeString().slice(0, 5)
      : null,
    endTime: timeSlot?.time_slot_end_datetime
      ? timeSlot.time_slot_end_datetime.toTimeString().slice(0, 5)
      : null,

    student: {
      id: booking.student_id,
      code: booking.student.student_code,

      // ✅ ชื่อ field ให้ตรง schema (…_th)
      name: sp
        ? `${sp.student_first_name_th} ${sp.student_last_name_th}`
        : null,
      nickname: sp?.student_nickname_th ?? null,

      phone: sp?.student_phone_number ?? null,
      email: sp?.student_email ?? null,

      faculty: booking.student.academic?.faculty?.faculty_name_th ?? null,
      department: booking.student.academic?.department?.department_name_th ?? null,
    },

    consultant: booking.consultant
      ? {
          id: booking.consultant_id,
          name: cp
            ? `${cp.consultant_first_name} ${cp.consultant_last_name}`
            : null,
          phone: cp?.consultant_phone_number ?? null,
          email: cp?.consultant_email ?? null,
        }
      : null,

    assignments: booking.assignments.map((a) => ({
      id: a.booking_assignment_id,
      assignedBy: a.assignedBy.account_username,
      assignedTo: a.consultant.profile
        ? `${a.consultant.profile.consultant_first_name} ${a.consultant.profile.consultant_last_name}`
        : null,
      note: a.assigned_note,
      assignedAt: a.assigned_at.toISOString(),
    })),

    outcome: booking.outcome
      ? {
          note: booking.outcome.booking_outcome_consultant_note,
          nextStep: booking.outcome.booking_outcome_next_step,
          riskLevel: booking.outcome.booking_outcome_risk_level,
          recordedAt: booking.outcome.booking_outcome_recorded_at.toISOString(),
        }
      : null,

    cancellation: booking.cancellation
      ? {
          reason: booking.cancellation.booking_cancellation_reason,
          cancelledBy: booking.cancellation.cancelledBy.account_username,
          cancelledAt: booking.cancellation.booking_cancellation_cancelled_at.toISOString(),
        }
      : null,

    feedback: booking.feedback
      ? {
          id: booking.feedback.feedback_id,
          isAnonymous: booking.feedback.feedback_is_anonymous,
          ratings: booking.feedback.ratings.map((r) => ({
            criterion: r.criterion.evaluation_criterion_topic_th,
            score: r.feedback_rating_score,
          })),
          comment: booking.feedback.comment?.feedback_comment_text ?? null,
          adminReply: booking.feedback.comment?.feedback_comment_admin_reply ?? null,
        }
      : null,
  };

  return NextResponse.json({ success: true, booking: formattedBooking });
}
