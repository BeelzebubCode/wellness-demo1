// src/app/api/v1/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccountFromRequest } from "@/lib/jwt";
import { BookingStatus, TimeSlotStatus } from "@prisma/client";

interface RouteParams {
  params: { id: string };
}

// GET /api/v1/bookings/:id
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const bookingId = Number(params.id);

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        student: {
          include: {
            profile: true,
            academic: { include: { faculty: true, department: true } },
            account: true,
          },
        },
        consultant: { include: { profile: true } },
        problemCategory: true,

        // ✅ เปลี่ยนจาก bookingSlots -> timeSlot
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

    const timeSlot = booking.timeSlot;
    const studentProfile = booking.student.profile;
    const consultantProfile = booking.consultant?.profile;

    const formattedBooking = {
      id: booking.booking_id,
      status: booking.booking_status,
      problemType: booking.problemCategory.problem_category_name_th,
      problemCategoryCode: booking.problemCategory.problem_category_code,
      detailText: booking.booking_detail_text,
      createdAt: booking.booking_created_at.toISOString(),
      updatedAt: booking.booking_updated_at.toISOString(),

      // Time info (จาก timeSlot ตรง ๆ)
      date: timeSlot?.time_slot_start_datetime
        ? timeSlot.time_slot_start_datetime.toISOString().split("T")[0]
        : null,
      startTime: timeSlot?.time_slot_start_datetime
        ? timeSlot.time_slot_start_datetime.toTimeString().slice(0, 5)
        : null,
      endTime: timeSlot?.time_slot_end_datetime
        ? timeSlot.time_slot_end_datetime.toTimeString().slice(0, 5)
        : null,

      // Student info
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

      // Consultant info
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

      // Assignment history
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

      // Outcome
      outcome: booking.outcome
        ? {
            note: booking.outcome.booking_outcome_consultant_note,
            nextStep: booking.outcome.booking_outcome_next_step,
            riskLevel: booking.outcome.booking_outcome_risk_level,
            recordedAt: booking.outcome.booking_outcome_recorded_at.toISOString(),
          }
        : null,

      // Cancellation
      cancellation: booking.cancellation
        ? {
            reason: booking.cancellation.booking_cancellation_reason,
            cancelledBy: booking.cancellation.cancelledBy.account_username,
            cancelledAt: booking.cancellation.booking_cancellation_cancelled_at.toISOString(),
          }
        : null,

      // Feedback
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
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

// PUT /api/v1/bookings/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const bookingId = Number(params.id);
    const body = await req.json();

    if (Number.isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const { action, consultantId, note, cancelReason } = body;

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      select: { booking_id: true, consultant_id: true, time_slot_id: true, booking_status: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
    }

    switch (action) {
      case "assign": {
        if (!consultantId) {
          return NextResponse.json({ error: "กรุณาระบุผู้ให้คำปรึกษา" }, { status: 400 });
        }

        const assignedById = body.assignedById; // ต้องเป็น consultant_id
        if (!assignedById) {
          return NextResponse.json({ error: "กรุณาระบุผู้จ่ายงาน" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { booking_id: bookingId },
            data: {
              booking_status: BookingStatus.ASSIGNED,
              consultant_id: consultantId,
            },
          });

          await tx.bookingAssignment.create({
            data: {
              booking_id: bookingId,
              booking_assignment_assigned_by_id: assignedById,
              booking_assignment_assigned_to_id: consultantId,
              booking_assignment_note: note,
            },
          });
        });

        return NextResponse.json({ success: true, status: BookingStatus.ASSIGNED });
      }

      case "start": {
        await prisma.booking.update({
          where: { booking_id: bookingId },
          data: { booking_status: BookingStatus.IN_PROGRESS },
        });

        return NextResponse.json({ success: true, status: BookingStatus.IN_PROGRESS });
      }

      case "complete": {
        const { consultantNote, nextStep, riskLevel } = body;

        if (!consultantNote) {
          return NextResponse.json({ error: "กรุณาระบุบันทึกการปรึกษา" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { booking_id: bookingId },
            data: { booking_status: BookingStatus.COMPLETED },
          });

          await tx.bookingOutcome.create({
            data: {
              booking_id: bookingId,
              booking_outcome_consultant_note: consultantNote,
              booking_outcome_next_step: nextStep,
              booking_outcome_risk_level: riskLevel,
            },
          });
        });

        return NextResponse.json({ success: true, status: BookingStatus.COMPLETED });
      }

      case "cancel": {
        if (!cancelReason) {
          return NextResponse.json({ error: "กรุณาระบุเหตุผลในการยกเลิก" }, { status: 400 });
        }

        const account = await getAccountFromRequest(req);
        if (!account) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (account.role !== "STUDENT") {
          return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
          // 1) cancel booking
          await tx.booking.update({
            where: { booking_id: bookingId },
            data: { booking_status: BookingStatus.CANCELLED },
          });

          // 2) insert cancellation record
          await tx.bookingCancellation.create({
            data: {
              booking_id: bookingId,
              booking_cancellation_cancelled_by_id: account.accountId,
              booking_cancellation_reason: cancelReason,
            },
          });

          // 3) capacity-aware update timeslot status
          const slot = await tx.timeSlot.findUnique({
            where: { time_slot_id: booking.time_slot_id },
            select: { time_slot_id: true, time_slot_max_capacity: true },
          });

          if (slot) {
            const activeCount = await tx.booking.count({
              where: {
                time_slot_id: slot.time_slot_id,
                booking_status: { not: BookingStatus.CANCELLED },
              },
            });

            // ถ้ายังไม่เต็ม -> AVAILABLE, ถ้าเต็ม -> BOOKED
            await tx.timeSlot.update({
              where: { time_slot_id: slot.time_slot_id },
              data: {
                time_slot_status:
                  activeCount < slot.time_slot_max_capacity
                    ? TimeSlotStatus.AVAILABLE
                    : TimeSlotStatus.BOOKED,
              },
            });
          }
        });

        return NextResponse.json({ success: true, status: BookingStatus.CANCELLED });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
