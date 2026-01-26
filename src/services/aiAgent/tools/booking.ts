// src/services/aiAgent/tools/booking.ts
import prisma from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";

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
  if (existing) throw new Error(`มีการจองที่ยังไม่เสร็จสิ้นอยู่แล้ว (#${existing.booking_id})`);

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

    const slotStatus = String(timeSlot.time_slot_status || "").toUpperCase();
    if (slotStatus === "LOCKED" || slotStatus === "CANCELLED")
      throw new Error("ช่วงเวลานี้ไม่สามารถจองได้");

    const bookedCount = await tx.booking.count({
      where: {
        university_id: activeUniversityId,
        time_slot_id: Number(timeSlotId),
        booking_status: { in: ACTIVE_STATUSES },
      },
    });

    if (bookedCount >= maxCapacity) {
      await tx.timeSlot.update({
        where: { time_slot_id: Number(timeSlotId) },
        data: { time_slot_status: "BOOKED" as any },
      });
      throw new Error("ช่วงเวลานี้เต็มแล้ว");
    }

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
      // ✅ ถ้ามี outcome/ผลการให้คำปรึกษา -> ถือว่าจบจริง ค่อยบล็อก
      let hasOutcome = false;
      try {
        // ปรับชื่อ model ให้ตรง schema นาย (ตัวอย่าง)
        const outcome = await (tx as any).bookingOutcome?.findFirst?.({
          where: { booking_id: completed.booking_id },
          select: { booking_id: true },
        });
        hasOutcome = !!outcome;
      } catch {
        // ถ้าไม่มีตาราง outcome ก็ fallback เป็น "ไม่บล็อก" เพื่อกัน false positive
        hasOutcome = false;
      }

      if (hasOutcome) {
        throw new Error("คุณเคยใช้ช่วงเวลานี้ไปแล้ว");
      }
    }

    const b = await tx.booking.create({
      data: {
        university_id: activeUniversityId,
        student_id: studentId,
        time_slot_id: Number(timeSlotId),
        problem_category_id: Number(problemCategoryId),
        booking_detail_text: detailText,
        booking_status: "PENDING_ASSIGNMENT",
        consultant_id: null,
      },
      select: { booking_id: true },
    });

    const newBookedCount = bookedCount + 1;
    await tx.timeSlot.update({
      where: { time_slot_id: Number(timeSlotId) },
      data: {
        time_slot_status:
          newBookedCount >= maxCapacity
            ? ("BOOKED" as any)
            : ("AVAILABLE" as any),
      },
    });

    return b;
  });

  return { bookingId: result.booking_id };
}

// ✅ NEW: ยกเลิก active booking ล่าสุด (ไม่ต้อง bookingId จาก user)
export async function agentCancelActiveForStudent(input: {
  activeUniversityId: number;
  studentId: number;
  reason?: string | null;
}) {
  const { activeUniversityId, studentId, reason } = input;

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        university_id: activeUniversityId,
        student_id: studentId,
        booking_status: { in: CANCELABLE_STATUSES },
      },
      orderBy: { booking_created_at: "desc" as any }, // ถ้าชื่อไม่ตรง schema ให้แก้
      select: {
        booking_id: true,
        university_id: true,
        student_id: true,
        booking_status: true,
        time_slot_id: true,
      },
    });

    if (!booking) throw new Error("ไม่พบนัดหมายที่กำลังดำเนินการอยู่");

    await tx.booking.update({
      where: { booking_id: booking.booking_id },
      data: { booking_status: "CANCELLED" as any },
    });

    // optional cancellation table
    try {
      await (tx as any).bookingCancellation.create({
        data: {
          booking_id: booking.booking_id,
          university_id: activeUniversityId,
          cancel_reason: reason || "ยกเลิกโดยผู้ใช้",
          cancelled_at: new Date(),
        },
      });
    } catch {}

    // recalc slot status
    if (booking.time_slot_id) {
      const slot = await tx.timeSlot.findUnique({
        where: { time_slot_id: booking.time_slot_id },
        select: {
          time_slot_id: true,
          university_id: true,
          time_slot_max_capacity: true,
        },
      });

      if (slot && Number(slot.university_id) === Number(activeUniversityId)) {
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
                activeCount >= maxCap
                  ? ("BOOKED" as any)
                  : ("AVAILABLE" as any),
            },
          });
        }
      }
    }

    return { bookingId: booking.booking_id };
  });
}
