// src/app/api/v1/bookings/[id]/route.ts
// ✅ Fixed: Uses Booking model from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/bookings/:id
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

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
            account: true,
          },
        },
        consultant: {
          include: {
            profile: true,
          },
        },
        problemCategory: true,
        bookingSlots: {
          include: {
            timeSlot: true,
          },
        },
        assignments: {
          include: {
            assignedBy: { include: { profile: true } },
            assignedTo: { include: { profile: true } },
          },
          orderBy: { booking_assignment_assigned_at: 'desc' },
        },
        outcome: true,
        cancellation: {
          include: {
            cancelledBy: true,
          },
        },
        feedback: {
          include: {
            ratings: {
              include: {
                criterion: true,
              },
            },
            comment: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบรายการจอง' },
        { status: 404 }
      );
    }

    // Format response
    const timeSlot = booking.bookingSlots[0]?.timeSlot;
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

      // Time info
      date: timeSlot?.time_slot_start_datetime.toISOString().split('T')[0] ?? null,
      startTime: timeSlot?.time_slot_start_datetime.toTimeString().slice(0, 5) ?? null,
      endTime: timeSlot?.time_slot_end_datetime.toTimeString().slice(0, 5) ?? null,

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
        faculty: booking.student.academic?.faculty.faculty_name_th ?? null,
        department: booking.student.academic?.department.department_name_th ?? null,
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
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/bookings/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await req.json();

    const { action, consultantId, note, cancelReason, accountId } = body;

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบรายการจอง' },
        { status: 404 }
      );
    }

    switch (action) {
      // จ่ายงานให้ Consultant
      case 'assign': {
        if (!consultantId) {
          return NextResponse.json(
            { error: 'กรุณาระบุผู้ให้คำปรึกษา' },
            { status: 400 }
          );
        }

        const assignedById = body.assignedById;
        if (!assignedById) {
          return NextResponse.json(
            { error: 'กรุณาระบุผู้จ่ายงาน' },
            { status: 400 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // อัพเดท booking
          await tx.booking.update({
            where: { booking_id: bookingId },
            data: {
              booking_status: 'ASSIGNED',
              consultant_id: consultantId,
            },
          });

          // สร้าง assignment record
          await tx.bookingAssignment.create({
            data: {
              booking_id: bookingId,
              booking_assignment_assigned_by_id: assignedById,
              booking_assignment_assigned_to_id: consultantId,
              booking_assignment_note: note,
            },
          });
        });

        return NextResponse.json({ success: true, status: 'ASSIGNED' });
      }

      // เริ่มให้คำปรึกษา
      case 'start': {
        await prisma.booking.update({
          where: { booking_id: bookingId },
          data: { booking_status: 'IN_PROGRESS' },
        });

        return NextResponse.json({ success: true, status: 'IN_PROGRESS' });
      }

      // เสร็จสิ้นการให้คำปรึกษา
      case 'complete': {
        const { consultantNote, nextStep, riskLevel } = body;

        if (!consultantNote) {
          return NextResponse.json(
            { error: 'กรุณาระบุบันทึกการปรึกษา' },
            { status: 400 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // อัพเดท booking
          await tx.booking.update({
            where: { booking_id: bookingId },
            data: { booking_status: 'COMPLETED' },
          });

          // สร้าง outcome record
          await tx.bookingOutcome.create({
            data: {
              booking_id: bookingId,
              booking_outcome_consultant_note: consultantNote,
              booking_outcome_next_step: nextStep,
              booking_outcome_risk_level: riskLevel,
            },
          });
        });

        return NextResponse.json({ success: true, status: 'COMPLETED' });
      }

      // ยกเลิกการจอง
      case 'cancel': {
        if (!cancelReason) {
          return NextResponse.json(
            { error: 'กรุณาระบุเหตุผลในการยกเลิก' },
            { status: 400 }
          );
        }

        if (!accountId) {
          return NextResponse.json(
            { error: 'กรุณาระบุผู้ยกเลิก' },
            { status: 400 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // อัพเดท booking
          await tx.booking.update({
            where: { booking_id: bookingId },
            data: { booking_status: 'CANCELLED' },
          });

          // สร้าง cancellation record
          await tx.bookingCancellation.create({
            data: {
              booking_id: bookingId,
              booking_cancellation_cancelled_by_id: accountId,
              booking_cancellation_reason: cancelReason,
            },
          });

          // คืน time slot status
          const bookingSlots = await tx.bookingSlot.findMany({
            where: { booking_id: bookingId },
          });

          for (const slot of bookingSlots) {
            await tx.timeSlot.update({
              where: { time_slot_id: slot.time_slot_id },
              data: { time_slot_status: 'AVAILABLE' },
            });
          }
        });

        return NextResponse.json({ success: true, status: 'CANCELLED' });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}