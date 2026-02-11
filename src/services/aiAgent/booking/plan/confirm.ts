// src/services/aiAgent/booking/plan/confirm.ts

import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function confirmBookingPlan(args: {
  activeUniversityId: number;
  studentId: number;
  payload: any;
}) {
  const { activeUniversityId, studentId, payload } = args;

  const timeSlotId = Number(payload?.timeSlotId);
  const problemCategoryId = Number(payload?.problemCategoryId);
  const detailText = payload?.detailText ? String(payload.detailText) : null;

  if (!Number.isFinite(timeSlotId) || !Number.isFinite(problemCategoryId)) {
    return { success: false, reply: "ข้อมูลยืนยันไม่ครบ (timeSlotId / problemCategoryId)" };
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findUnique({
        where: {
          university_id_time_slot_id: {
            university_id: activeUniversityId,
            time_slot_id: timeSlotId,
          },
        },
        select: {
          time_slot_id: true,
          time_slot_max_capacity: true,
          time_slot_status: true,
        },
      });

      if (!slot) throw new Error("Time slot not found");
      if (slot.time_slot_status !== "OPEN") throw new Error("Time slot is not open");

      const count = await tx.booking.count({
        where: {
          university_id: activeUniversityId,
          time_slot_id: timeSlotId,
          booking_status: {
            in: [
              BookingStatus.PENDING_ASSIGNMENT,
              BookingStatus.ASSIGNED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (count >= Number(slot.time_slot_max_capacity ?? 0)) {
        throw new Error("Time slot is full");
      }

      const pending = await tx.booking.findFirst({
        where: {
          student_id: studentId,
          university_id: activeUniversityId,
          booking_status: {
            in: [
              BookingStatus.PENDING_ASSIGNMENT,
              BookingStatus.ASSIGNED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
        select: { booking_id: true },
      });

      if (pending) throw new Error("You already have an active booking");

      return tx.booking.create({
        data: {
          university_id: activeUniversityId,
          student_id: studentId,
          time_slot_id: timeSlotId,
          problem_category_id: problemCategoryId,
          booking_detail_text: detailText,
          booking_status: BookingStatus.PENDING_ASSIGNMENT,
          booking_service_mode: "ONSITE", // ✅ Fix: Missing required field
        },
        select: { booking_id: true },
      });
    });

    return {
      success: true,
      bookingId: (booking as any).booking_id,
      reply: `✅ จองสำเร็จ (Booking #${(booking as any).booking_id})`,
    };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { success: false, reply: "สล็อตนี้ถูกจองไปแล้ว" };
    }
    return { success: false, reply: `จองไม่สำเร็จ: ${err?.message ?? "error"}` };
  }
}
