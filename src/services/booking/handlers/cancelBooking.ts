// src/services/booking/handlers/cancelBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertRole, type TenantContext } from "@/lib/tenant/server";
import { BookingStatus, TimeSlotStatus } from "@prisma/client";
import { applyLateCancelPenalty, applyNoShowPenalty } from "@/services/booking/penaltyEngine";

type Input = {
  tenant: TenantContext;
  bookingIdRaw: string;
  body: any;
};

function toInt(idRaw: string) {
  const n = Number(idRaw);
  return Number.isFinite(n) ? n : NaN;
}

export async function handleCancelBooking({ tenant, bookingIdRaw, body }: Input) {
  const { account, activeUniversityId } = tenant;

  assertRole(String(account.role || "").toUpperCase(), ["STUDENT"]);

  const bookingId = toInt(bookingIdRaw);
  if (Number.isNaN(bookingId)) {
    return NextResponse.json({ success: false, error: "Invalid booking ID" }, { status: 400 });
  }

  const cancellationReasonId = Number(body?.cancellationReasonId);
  if (!cancellationReasonId || Number.isNaN(cancellationReasonId)) {
    return NextResponse.json({ success: false, error: "กรุณาเลือกเหตุผลในการยกเลิก" }, { status: 400 });
  }

  const cancellationNote = String(body?.cancellationNote ?? "").trim() || null;

  // Optional: exception request data for Flow #1 (cancel + submit now)
  const exceptionData = body?.exception_request as
    | { reason_code: string; reason_detail: string; evidences?: Array<{ file_url: string; file_name?: string; file_type?: string; file_size?: number }> }
    | undefined;

  // Validate that cancellation reason exists
  const reasonExists = await prisma.cancellationReason.findUnique({
    where: { cancellation_reason_id: cancellationReasonId },
  });

  if (!reasonExists) {
    return NextResponse.json({ success: false, error: "Invalid cancellation reason" }, { status: 400 });
  }

  // ✅ โหลด booking แบบ tenant-safe + owner-safe
  const booking = await prisma.booking.findFirst({
    where: {
      booking_id: bookingId,
      university_id: activeUniversityId,
      student: { is: { account_id: account.accountId } },
    },
    select: {
      booking_id: true,
      university_id: true,
      time_slot_id: true,
      booking_status: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  if (
    booking.booking_status === BookingStatus.CANCELLED ||
    booking.booking_status === BookingStatus.COMPLETED
  ) {
    return NextResponse.json({ success: false, error: "ไม่สามารถยกเลิกสถานะนี้ได้" }, { status: 409 });
  }

  // ✅ Load student info & time_slot for penalty engine
  const bookingFull = await prisma.booking.findFirst({
    where: { booking_id: bookingId, university_id: activeUniversityId },
    include: { 
      student: { select: { student_id: true } },
      timeSlot: { select: { time_slot_start_datetime: true } }
    },
  });

  const studentId = bookingFull?.student?.student_id;
  const timeDiffHours = bookingFull?.timeSlot?.time_slot_start_datetime 
    ? (bookingFull.timeSlot.time_slot_start_datetime.getTime() - Date.now()) / (1000 * 60 * 60)
    : Number.MAX_SAFE_INTEGER;

  const isVeryLateCancel = timeDiffHours < 6;
  const isLateCancel = timeDiffHours >= 6 && timeDiffHours < 24;

  await prisma.$transaction(async (tx) => {
    // ✅ update booking ด้วย composite key
    await tx.booking.update({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: bookingId,
        },
      },
      data: { booking_status: BookingStatus.CANCELLED },
    });

    // ✅ upsert cancellation ด้วย composite key
    const now = new Date();
    await tx.bookingCancellation.upsert({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: bookingId,
        },
      },
      update: {
        booking_cancellation_cancelled_by_id: account.accountId,
        cancellation_reason_id: cancellationReasonId,
        booking_cancellation_note: cancellationNote,
      },
      create: {
        university_id: activeUniversityId,
        booking_id: bookingId,
        booking_cancellation_cancelled_by_id: account.accountId,
        cancellation_reason_id: cancellationReasonId,
        booking_cancellation_note: cancellationNote,
      },
    });

    // ✅ Apply penalty based on time
    if (studentId) {
      if (isVeryLateCancel) {
        await applyNoShowPenalty(tx as any, {
          universityId: activeUniversityId,
          studentId,
          bookingId,
          actorAccountId: account.accountId,
        });
      } else if (isLateCancel) {
        await applyLateCancelPenalty(tx as any, {
          universityId: activeUniversityId,
          studentId,
          bookingId,
          actorAccountId: account.accountId,
        });
      }
    }

    // ✅ Flow #1: create exception request immediately if provided
    if (exceptionData?.reason_code && exceptionData?.reason_detail && studentId) {
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + 3);

      const exReq = await tx.bookingExceptionRequest.create({
        data: {
          university_id: activeUniversityId,
          booking_id: bookingId,
          student_id: studentId,
          booking_exception_reason_code: exceptionData.reason_code,
          booking_exception_reason_detail: exceptionData.reason_detail,
          booking_exception_status: "PENDING_REVIEW",
          booking_exception_deadline_at: deadline,
          booking_exception_submitted_at: now,
        },
      });

      if (Array.isArray(exceptionData.evidences) && exceptionData.evidences.length > 0) {
        await tx.bookingExceptionEvidence.createMany({
          data: exceptionData.evidences.map((e) => ({
            booking_exception_request_id: exReq.booking_exception_request_id,
            booking_exception_evidence_url: e.file_url,
            booking_exception_evidence_name: e.file_name ?? null,
            booking_exception_evidence_type: e.file_type ?? null,
            booking_exception_evidence_size: e.file_size ?? null,
          })),
        });
      }
    }

    // ✅ slot ต้อง query ด้วย composite key
    const slot = await tx.timeSlot.findUnique({
      where: {
        university_id_time_slot_id: {
          university_id: activeUniversityId,
          time_slot_id: booking.time_slot_id,
        },
      },
      select: {
        time_slot_id: true,
        time_slot_max_capacity: true,
      },
    });

    if (!slot) return;

    // ✅ count เฉพาะ tenant นี้
    const activeCount = await tx.booking.count({
      where: {
        university_id: activeUniversityId,
        time_slot_id: slot.time_slot_id,
        booking_status: {
          in: [
            BookingStatus.PENDING_ASSIGNMENT,
            BookingStatus.ASSIGNED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      },
    });

    const cap = Number(slot.time_slot_max_capacity ?? 0);
    const nextStatus = activeCount < cap ? TimeSlotStatus.OPEN : TimeSlotStatus.FULL;

    await tx.timeSlot.update({
      where: {
        university_id_time_slot_id: {
          university_id: activeUniversityId,
          time_slot_id: slot.time_slot_id,
        },
      },
      data: { time_slot_status: nextStatus },
    });
  });

  return NextResponse.json({ success: true, status: BookingStatus.CANCELLED });
}
