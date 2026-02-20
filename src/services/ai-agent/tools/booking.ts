// src/services/aiAgent/tools/booking.ts
import prisma from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";
import { TimeSlotStatus } from "@prisma/client";

const ACTIVE_STATUSES: BookingStatus[] = [
  "PENDING_ASSIGNMENT",
  "ASSIGNED",
  "IN_PROGRESS",
];

const CANCELABLE_STATUSES: BookingStatus[] = [
  "PENDING_ASSIGNMENT",
  "ASSIGNED",
  "IN_PROGRESS",
];

export type AgentBookInput = {
  activeUniversityId: number;
  studentId: number;
  timeSlotId: number;
  problemCategoryId: number;
  detailText: string | null;
};

export type AgentBookResult = { bookingId: number };

export async function agentBookForStudent(
  input: AgentBookInput,
): Promise<AgentBookResult> {
  const {
    activeUniversityId,
    studentId,
    timeSlotId,
    problemCategoryId,
    detailText,
  } = input;

  if (!timeSlotId || Number.isNaN(Number(timeSlotId)))
    throw new Error("timeSlotId ไม่ถูกต้อง");
  if (!problemCategoryId || Number.isNaN(Number(problemCategoryId)))
    throw new Error("problemCategoryId ไม่ถูกต้อง");

  // ✅ กัน 1 คนมี booking active อยู่แล้ว
  const existing = await prisma.booking.findFirst({
    where: {
      university_id: activeUniversityId,
      student_id: studentId,
      booking_status: { in: ACTIVE_STATUSES },
    },
    select: { booking_id: true },
  });

  if (existing) {
    throw new Error(
      `มีการจองที่ยังไม่เสร็จสิ้นอยู่แล้ว (#${existing.booking_id})`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const timeSlot = await tx.timeSlot.findUnique({
      where: { time_slot_id: Number(timeSlotId) },
      select: {
        time_slot_id: true,
        university_id: true,
        time_slot_max_capacity: true,
        time_slot_status: true,
      },
    });

    if (!timeSlot) throw new Error("ไม่พบช่วงเวลานี้ในระบบ");
    if (Number(timeSlot.university_id) !== Number(activeUniversityId))
      throw new Error("ช่วงเวลานี้เป็นของมหาลัยอื่น");

    const maxCapacity = Number(timeSlot.time_slot_max_capacity ?? 0);
    if (!maxCapacity || maxCapacity <= 0)
      throw new Error("ช่วงเวลานี้ไม่ได้เปิดรับจอง");

    // ✅ block ตาม enum ใหม่
    const slotStatus = String(timeSlot.time_slot_status || "").toUpperCase();
    if (
      slotStatus === TimeSlotStatus.CLOSED ||
      slotStatus === TimeSlotStatus.CANCELLED ||
      slotStatus === TimeSlotStatus.FULL
    ) {
      throw new Error("ช่วงเวลานี้ไม่สามารถจองได้");
    }

    const bookedCount = await tx.booking.count({
      where: {
        university_id: activeUniversityId,
        time_slot_id: Number(timeSlotId),
        booking_status: { in: ACTIVE_STATUSES },
      },
    });

    if (bookedCount >= maxCapacity) {
      // mark FULL (กันข้อมูลค้าง)
      await tx.timeSlot.update({
        where: { time_slot_id: Number(timeSlotId) },
        data: { time_slot_status: TimeSlotStatus.FULL },
      });
      throw new Error("ช่วงเวลานี้เต็มแล้ว");
    }

    // กันเคส “จองซ้ำ slot เดิม” แบบ completed + มี outcome แล้ว
    const completed = await tx.booking.findFirst({
      where: {
        university_id: activeUniversityId,
        student_id: studentId,
        time_slot_id: Number(timeSlotId),
        booking_status: "COMPLETED",
      },
      select: { booking_id: true },
    });

    if (completed) {
      let hasOutcome = false;
      try {
        const outcome = await (tx as any).bookingOutcome?.findFirst?.({
          where: { booking_id: completed.booking_id },
          select: { booking_id: true },
        });
        hasOutcome = !!outcome;
      } catch {
        hasOutcome = false;
      }

      if (hasOutcome) {
        throw new Error("คุณเคยใช้ช่วงเวลานี้ไปแล้ว");
      }
    }

    // create booking
    const b = await tx.booking.create({
      data: {
        university_id: activeUniversityId,
        student_id: studentId,
        time_slot_id: Number(timeSlotId),
        problem_category_id: Number(problemCategoryId),
        booking_detail_text: detailText,
        booking_status: "PENDING_ASSIGNMENT",
        consultant_id: null,
        booking_service_mode: "ONSITE", // ✅ Fix: Default to ONSITE for AI bookings
      },
      select: { booking_id: true },
    });

    // update slot status -> FULL / OPEN
    const newBookedCount = bookedCount + 1;
    await tx.timeSlot.update({
      where: { time_slot_id: Number(timeSlotId) },
      data: {
        time_slot_status:
          newBookedCount >= maxCapacity
            ? TimeSlotStatus.FULL
            : TimeSlotStatus.OPEN,
      },
    });

    return b;
  });

  return { bookingId: result.booking_id };
}

export async function agentCancelActiveForStudent(input: {
  activeUniversityId: number;
  studentId: number;
  reason?: string | null;
  cancelledByAccountId?: number | null;
}) {
  const { activeUniversityId, studentId, reason, cancelledByAccountId } = input;

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        university_id: activeUniversityId,
        student_id: studentId,
        booking_status: { in: CANCELABLE_STATUSES },
      },
      orderBy: { booking_created_at: "desc" },
      select: {
        booking_id: true,
        university_id: true,
        student_id: true,
        booking_status: true,
        time_slot_id: true,
      },
    });

    if (!booking) {
      // ✅ idempotent: ถ้าไม่มี active แล้ว ถือว่ายกเลิกไปแล้ว/ไม่มีนัด
      // จะ throw ก็ได้ แต่แบบนี้ AI/UX จะ “ไม่แดง” เวลา user กดซ้ำ
      return { bookingId: 0 };
    }

    const upd = await tx.booking.updateMany({
      where: {
        university_id: booking.university_id,
        booking_id: booking.booking_id,
        booking_status: { in: CANCELABLE_STATUSES }, // ถ้าโดน cancel ไปแล้ว upd.count จะเป็น 0
      },
      data: { booking_status: "CANCELLED" as any },
    });

    const bookingId = booking.booking_id;

    // ✅ optional: create cancellation record (ทำแบบ "ไม่ทำให้ทั้ง txn ล้ม" เหมือนเดิม)
    if (upd.count > 0 && cancelledByAccountId && Number(cancelledByAccountId) > 0) {
      try {
        await (tx as any).bookingCancellation.create({
          data: {
            university_id: booking.university_id, // ✅ ถ้า schema มี tenant field
            booking_id: booking.booking_id,
            booking_cancellation_cancelled_by_id: Number(cancelledByAccountId),
            cancellation_reason_id: 6, // OTHER category for AI cancellations
            booking_cancellation_note: reason || "ยกเลิกโดยผู้ใช้",
          },
        });
      } catch {
        // ignore
      }
    }

    // ✅ recalc slot status เฉพาะตอนที่ “มีการเปลี่ยนสถานะจริง” (upd.count > 0)
    if (upd.count > 0 && booking.time_slot_id) {
      const slot = await tx.timeSlot.findUnique({
        where: { time_slot_id: booking.time_slot_id },
        select: {
          time_slot_id: true,
          university_id: true,
          time_slot_max_capacity: true,
          time_slot_status: true,
        },
      });

      if (slot && Number(slot.university_id) === Number(activeUniversityId)) {
        const st = String(slot.time_slot_status || "").toUpperCase();
        const isHardBlocked =
          st === TimeSlotStatus.CLOSED || st === TimeSlotStatus.CANCELLED;

        if (!isHardBlocked) {
          const maxCap = Number(slot.time_slot_max_capacity ?? 0);

          if (maxCap > 0) {
            const activeCount = await tx.booking.count({
              where: {
                university_id: activeUniversityId,
                time_slot_id: slot.time_slot_id,
                booking_status: { in: ACTIVE_STATUSES },
              },
            });

            await tx.timeSlot.update({
              where: { time_slot_id: slot.time_slot_id },
              data: {
                time_slot_status:
                  activeCount >= maxCap ? TimeSlotStatus.FULL : TimeSlotStatus.OPEN,
              },
            });
          } else {
            await tx.timeSlot.update({
              where: { time_slot_id: slot.time_slot_id },
              data: { time_slot_status: TimeSlotStatus.CLOSED },
            });
          }
        }
      }
    }

    return { bookingId };
  });
}

