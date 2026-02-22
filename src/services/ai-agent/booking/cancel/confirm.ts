// src/services/aiAgent/booking/cancel/confirm.ts

import prisma from "@/lib/prisma";
import { BookingStatus, TimeSlotStatus } from "@prisma/client";
import { applyLateCancelPenalty, applyNoShowPenalty } from "@/services/booking/penaltyEngine";

export async function confirmBookingCancel(args: {
  activeUniversityId: number;
  studentId: number;
  cancelledByAccountId: number;
  payload: any;
}) {
  const { activeUniversityId, studentId, cancelledByAccountId, payload } = args;

  const reason = String(payload?.reason ?? "").trim();
  if (!reason) return { success: false, reply: "กรุณาระบุเหตุผลในการยกเลิก" };

  // ✅ Load booking + timeSlot start time for penalty calculation (same as cancelBooking.ts)
  const booking = await prisma.booking.findFirst({
    where: {
      university_id: activeUniversityId,
      student_id: studentId,
      booking_status: {
        in: [
          BookingStatus.PENDING_ASSIGNMENT,
          BookingStatus.ASSIGNED,
          BookingStatus.IN_PROGRESS,
        ],
      },
    },
    orderBy: { booking_created_at: "desc" },
    select: {
      booking_id: true,
      time_slot_id: true,
      timeSlot: { select: { time_slot_start_datetime: true } },
    },
  });

  if (!booking) {
    return { success: false, reply: "ไม่พบนัดที่สามารถยกเลิกได้" };
  }

  // ✅ Penalty gate — same logic as handleCancelBooking
  const timeDiffHours = booking.timeSlot?.time_slot_start_datetime
    ? (booking.timeSlot.time_slot_start_datetime.getTime() - Date.now()) / (1000 * 60 * 60)
    : Number.MAX_SAFE_INTEGER;

  const isVeryLateCancel = timeDiffHours < 6;   // treat as no-show level
  const isLateCancel = timeDiffHours >= 6 && timeDiffHours < 24;

  await prisma.$transaction(async (tx) => {
    // ── 1. Update booking status ──────────────────────────────────────────────
    await tx.booking.update({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: booking.booking_id,
        },
      },
      data: { booking_status: BookingStatus.CANCELLED },
    });

    // ── 2. Record cancellation reason ────────────────────────────────────────
    await tx.bookingCancellation.upsert({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: booking.booking_id,
        },
      },
      update: {
        booking_cancellation_cancelled_by_id: cancelledByAccountId,
        cancellation_reason_id: 6, // "OTHER" — AI-generated
        booking_cancellation_note: reason,
      },
      create: {
        university_id: activeUniversityId,
        booking_id: booking.booking_id,
        booking_cancellation_cancelled_by_id: cancelledByAccountId,
        cancellation_reason_id: 6,
        booking_cancellation_note: reason,
      },
    });

    // ── 3. Apply penalty (same rules as normal cancel flow) ──────────────────
    if (isVeryLateCancel) {
      // < 6h before appointment → no-show-level penalty
      await applyNoShowPenalty(tx as any, {
        universityId: activeUniversityId,
        studentId,
        bookingId: booking.booking_id,
        actorAccountId: cancelledByAccountId,
      });
    } else if (isLateCancel) {
      // 6–24h before appointment → late cancel penalty
      await applyLateCancelPenalty(tx as any, {
        universityId: activeUniversityId,
        studentId,
        bookingId: booking.booking_id,
        actorAccountId: cancelledByAccountId,
      });
    }

    // ── 4. Reopen time slot if capacity allows ───────────────────────────────
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

  // ✅ Return with penalty context so AI can inform the user
  let penaltyNote = "";
  if (isVeryLateCancel) {
    penaltyNote = "\n⚠️ เนื่องจากยกเลิกก่อนนัดน้อยกว่า 6 ชั่วโมง อาจมีการหักแต้มระดับ No-Show";
  } else if (isLateCancel) {
    penaltyNote = "\n⚠️ เนื่องจากยกเลิกกะทันหัน (ก่อนนัดไม่ถึง 24 ชั่วโมง) อาจมีผลต่อแต้มความน่าเชื่อถือ";
  }

  return {
    success: true,
    bookingId: booking.booking_id,
    reply: `✅ ยกเลิกนัดสำเร็จ (Booking #${booking.booking_id})${penaltyNote}`,
  };
}
