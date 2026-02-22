// src/app/api/v2/bookings/[id]/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";
import { AttendanceStatus } from "@prisma/client";
import { applyNoShowPenalty, reverseNoShowPenalty } from "@/services/booking/penaltyEngine";

type Params = { params: { id: string } };

const ALLOWED_ROLES = ["CONSULTANT", "HEAD_CONSULTANT"];
const GRACE_MINUTES = 10; // NO_SHOW only allowed >= 10 min after slot start

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req);
    const { account, activeUniversityId } = tenant;

    if (!ALLOWED_ROLES.includes(account.role ?? "")) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const bookingId = Number(params.id);
    if (!Number.isFinite(bookingId)) {
      return NextResponse.json({ success: false, error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const status: AttendanceStatus = body.status;
    if (!["CHECKED_IN", "LATE", "NO_SHOW"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    // Load booking — check university_id
    const booking = await prisma.booking.findFirst({
      where: { booking_id: bookingId, university_id: activeUniversityId },
      select: {
        booking_id: true,
        university_id: true,
        booking_status: true,
        student_id: true,
        time_slot_id: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "ไม่พบรายการจอง" }, { status: 404 });
    }

    // Load the time slot start time
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { university_id_time_slot_id: { university_id: activeUniversityId, time_slot_id: booking.time_slot_id } },
      select: { time_slot_start_datetime: true },
    });

    // Load active assignments
    const assignments = await prisma.bookingAssignment.findMany({
      where: { university_id: activeUniversityId, booking_id: bookingId, is_active: true },
      select: { consultant_id: true },
    });

    // Verify this consultant is assigned to this booking
    const consultantAccount = await prisma.consultant.findUnique({
      where: { account_id: account.accountId },
      select: { consultant_id: true },
    });

    const isAssigned = assignments.some(
      (a) => a.consultant_id === consultantAccount?.consultant_id,
    );
    const isHC = account.role === "HEAD_CONSULTANT";

    if (!isAssigned && !isHC) {
      return NextResponse.json({ success: false, error: "ท่านไม่ได้รับมอบหมายการจองนี้" }, { status: 403 });
    }

    // Grace period check for NO_SHOW(Temporarily disabled for testing)
    //   if (status === "NO_SHOW" && timeSlot?.time_slot_start_datetime) {
    //     const slotStart = new Date(timeSlot.time_slot_start_datetime);
    //     const minAllowed = new Date(slotStart.getTime() + GRACE_MINUTES * 60 * 1000);
    //     if (new Date() < minAllowed) {
    //       return NextResponse.json(
    //         { success: false, error: `ต้องรอ ${GRACE_MINUTES} นาทีหลังเวลานัดเริ่มจึงจะกด NO_SHOW ได้` },
    //         { status: 422 },
    //       );
    //     }
    //   }

    const lateMinutes = status === "LATE" ? Number(body.late_minutes ?? 0) : null;
    const note = String(body.note ?? "").trim() || null;
    const now = new Date();

    // Upsert attendance + conditionally apply penalty — all atomic
    await prisma.$transaction(async (tx) => {
      const existingAttendance = await tx.bookingAttendance.findUnique({
        where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } },
        select: { booking_attendance_status: true }
      });
      const wasNoShow = existingAttendance?.booking_attendance_status === "NO_SHOW";
      const isNowNoShow = status === "NO_SHOW";

      await tx.bookingAttendance.upsert({
        where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } },
        create: {
          university_id: activeUniversityId,
          booking_id: bookingId,
          booking_attendance_status: status,
          booking_attendance_checked_in_at: status === "CHECKED_IN" ? now : null,
          booking_attendance_late_minutes: lateMinutes,
          booking_attendance_note: note,
          booking_attendance_marked_by_id: account.accountId,
          booking_attendance_marked_at: now,
        },
        update: {
          booking_attendance_status: status,
          booking_attendance_checked_in_at: status === "CHECKED_IN" ? now : null,
          booking_attendance_late_minutes: lateMinutes,
          booking_attendance_note: note,
          booking_attendance_marked_by_id: account.accountId,
          booking_attendance_marked_at: now,
        },
      });

      if (isNowNoShow && !wasNoShow && booking.student_id) {
        await applyNoShowPenalty(tx as any, {
          universityId: activeUniversityId,
          studentId: booking.student_id,
          bookingId,
          actorAccountId: account.accountId,
        });
      } else if (!isNowNoShow && wasNoShow && booking.student_id) {
        await reverseNoShowPenalty(tx as any, {
          universityId: activeUniversityId,
          studentId: booking.student_id,
          bookingId,
          actorAccountId: account.accountId,
        });
      }
    });

    return NextResponse.json({ success: true, status });
  } catch (e: any) {
    console.error("[POST /api/v2/bookings/:id/attendance]", e);
    return NextResponse.json({ success: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
