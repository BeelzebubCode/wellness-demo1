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
    const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;

    if (typeof activeUniversityId !== "number") {
        return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
    }

    // ✅ tenant guard
    const denied = requireUniversity(ctx as any, activeUniversityId);
    if (denied) return denied;

    // ✅ ต้องมี studentId
    const studentId = (ctx as any).studentId as number | undefined;
    if (typeof studentId !== "number") {
        return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
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
                where: { time_slot_id: timeSlotId },
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

            if (slot.university_id !== activeUniversityId) {
                throw Object.assign(new Error("Forbidden (cross-tenant)"), { status: 403 });
            }

            // ✅ กันเต็ม (นับจำนวน booking ของ slot)
            const count = await tx.booking.count({
                where: { time_slot_id: timeSlotId },
            });

            if (count >= slot.time_slot_max_capacity) {
                throw Object.assign(new Error("Time slot is full"), { status: 409 });
            }

            // ✅ กันจองซ้ำ slot เดิม
            const dup = await tx.booking.findFirst({
                where: { time_slot_id: timeSlotId, student_id: studentId },
                select: { booking_id: true },
            });

            if (dup) {
                throw Object.assign(new Error("You already booked this slot"), { status: 409 });
            }

            // ✅ (optional) กันคนมี booking ค้างอยู่แล้ว
            // ถ้าคุณมี policy แบบ “ห้ามจองซ้อน”
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
                throw Object.assign(new Error("You already have an active booking"), { status: 409 });
            }

            // ✅ create (เติม university_id ให้ครบ)
            return await tx.booking.create({
                data: {
                    university_id: slot.university_id,
                    student_id: studentId,
                    time_slot_id: timeSlotId,
                    problem_category_id: problemCategoryId,
                    booking_detail_text: detailText,
                    booking_status: "PENDING_ASSIGNMENT",
                } as any,
            });
        });

        return NextResponse.json({
            success: true,
            bookingId: (booking as any).booking_id,
        });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json(
            { error: err?.message ?? "Failed to create booking" },
            { status },
        );
    }
}
