// src/services/aiAgent/booking/cancel/confirm.ts

import prisma from "@/lib/prisma";
import { BookingStatus, TimeSlotStatus } from "@prisma/client";

export async function confirmBookingCancel(args: {
  activeUniversityId: number;
  studentId: number;
  cancelledByAccountId: number; // ✅ เพิ่ม
  payload: any;
}) {
  const { activeUniversityId, studentId, cancelledByAccountId, payload } = args;

  const reason = String(payload?.reason ?? "").trim();
  if (!reason) return { success: false, reply: "กรุณาระบุเหตุผลในการยกเลิก" };

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
    },
  });

  if (!booking) {
    return { success: false, reply: "ไม่พบนัดที่สามารถยกเลิกได้" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: booking.booking_id,
        },
      },
      data: { booking_status: BookingStatus.CANCELLED },
    });

    // ✅ จุดที่พังบ่อย: create ต้องใส่ cancelled_by_id (ถ้าฟิลด์นี้ not null)
    await tx.bookingCancellation.upsert({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: booking.booking_id,
        },
      },
      update: {
        booking_cancellation_cancelled_by_id: cancelledByAccountId, // ✅ เพิ่ม
        booking_cancellation_reason: reason,
      },
      create: {
        university_id: activeUniversityId,
        booking_id: booking.booking_id,
        booking_cancellation_cancelled_by_id: cancelledByAccountId, // ✅ เพิ่ม
        booking_cancellation_reason: reason,
      },
    });

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

  return {
    success: true,
    bookingId: booking.booking_id,
    reply: `✅ ยกเลิกนัดสำเร็จ (Booking #${booking.booking_id})`,
  };
}
