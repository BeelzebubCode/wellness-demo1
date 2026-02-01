// src\services\booking\handlers\createBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus } from "@prisma/client";

type CreateBookingInput = {
  timeSlotId: number;
  problemCategoryId: number;
  detailText?: string | null;
};

export async function handleCreateBooking(
  ctx: AccountContext & { activeUniversityId?: number; studentId?: number },
  input: Partial<CreateBookingInput>,
) {
  const activeUniversityId = (ctx as any).activeUniversityId as
    | number
    | undefined;

  if (typeof activeUniversityId !== "number") {
    return NextResponse.json(
      { error: "activeUniversityId missing" },
      { status: 400 },
    );
  }

  // ✅ tenant guard
  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  // ✅ ต้องมี studentId
  const studentId = (ctx as any).studentId as number | undefined;
  if (typeof studentId !== "number") {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 400 },
    );
  }

  const timeSlotId = Number(input.timeSlotId);
  const problemCategoryId = Number(input.problemCategoryId);
  const detailText = input.detailText ? String(input.detailText) : null;

  if (!Number.isFinite(timeSlotId) || !Number.isFinite(problemCategoryId)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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
          university_id: true,
          time_slot_max_capacity: true,
          time_slot_status: true,
        },
      });

      if (!slot) {
        throw Object.assign(new Error("Time slot not found"), { status: 404 });
      }

      if (slot.time_slot_status !== "OPEN") {
        throw Object.assign(new Error("Time slot is not open"), {
          status: 409,
        });
      }

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

      if (count >= slot.time_slot_max_capacity) {
        throw Object.assign(new Error("Time slot is full"), { status: 409 });
      }

      const dup = await tx.booking.findFirst({
        where: {
          university_id: activeUniversityId,
          time_slot_id: timeSlotId,
          student_id: studentId,
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

      if (dup) {
        throw Object.assign(new Error("You already booked this slot"), {
          status: 409,
        });
      }

      // ✅ กันคนมี booking ค้างอยู่แล้ว (เฉพาะ tenant นี้) — ของคุณถูกแล้ว
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

      if (pending) {
        throw Object.assign(new Error("You already have an active booking"), {
          status: 409,
        });
      }

      return tx.booking.create({
        data: {
          university_id: activeUniversityId,
          student_id: studentId,
          time_slot_id: timeSlotId,
          problem_category_id: problemCategoryId,
          booking_detail_text: detailText,
          booking_status: BookingStatus.PENDING_ASSIGNMENT,
        },
        select: { booking_id: true },
      });
    });

    return NextResponse.json({
      success: true,
      bookingId: (booking as any).booking_id,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 409 },
      );
    }

    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? "Failed to create booking" },
      { status },
    );
  }
}
