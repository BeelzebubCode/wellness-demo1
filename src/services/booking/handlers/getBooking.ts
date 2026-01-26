// src/services/booking/handlers/getBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { AccountRole } from "@prisma/client";

function isAdminRole(role: AccountRole) {
  return role === "HEAD_CONSULTANT" || role === "SUPER_ADMIN" || role === "RECTOR";
}

export async function handleGetBooking(ctx: AccountContext, bookingIdRaw: string) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    include: {
      student: {
        include: {
          profile: true,
          academic: { include: { faculty: true, department: true } },
          account: true, // owner check
        },
      },
      consultant: { include: { profile: true } },
      problemCategory: true,
      timeSlot: true,
      assignments: {
        include: {
          assignedBy: { include: { profile: true } },
          assignedTo: { include: { profile: true } },
        },
        orderBy: { booking_assignment_assigned_at: "desc" },
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

  // tenant guard
  const deniedUni = requireUniversity(ctx, booking.university_id);
  if (deniedUni) return deniedUni;

  const role = ctx.role as AccountRole;

  // role-based view guard
  if (role === "STUDENT") {
    if (booking.student.account.account_id !== ctx.accountId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
  } else if (role === "CONSULTANT") {
    if (!ctx.consultantId || booking.consultant_id !== ctx.consultantId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
  } else if (!isAdminRole(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const timeSlot = booking.timeSlot;
  const studentProfile = booking.student.profile;
  const consultantProfile = booking.consultant?.profile;

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
      name: studentProfile
        ? `${studentProfile.student_first_name} ${studentProfile.student_last_name}`
        : null,
      nickname: studentProfile?.student_nickname,
      phone: studentProfile?.student_phone_number,
      email: studentProfile?.student_email,
      faculty: booking.student.academic?.faculty?.faculty_name_th ?? null,
      department: booking.student.academic?.department?.department_name_th ?? null,
      lineUserId: booking.student.account.account_line_id,
    },

    consultant: booking.consultant
      ? {
          id: booking.consultant_id,
          name: consultantProfile
            ? `${consultantProfile.consultant_first_name} ${consultantProfile.consultant_last_name}`
            : null,
          phone: consultantProfile?.consultant_phone_number,
          email: consultantProfile?.consultant_email,
        }
      : null,

    assignments: booking.assignments.map((a) => ({
      id: a.booking_assignment_id,
      assignedBy: a.assignedBy.profile
        ? `${a.assignedBy.profile.consultant_first_name} ${a.assignedBy.profile.consultant_last_name}`
        : null,
      assignedTo: a.assignedTo.profile
        ? `${a.assignedTo.profile.consultant_first_name} ${a.assignedTo.profile.consultant_last_name}`
        : null,
      note: a.booking_assignment_note,
      assignedAt: a.booking_assignment_assigned_at.toISOString(),
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
          comment: booking.feedback.comment?.feedback_comment_text,
          adminReply: booking.feedback.comment?.feedback_comment_admin_reply,
        }
      : null,
  };

  return NextResponse.json({ success: true, booking: formattedBooking });
}
