import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";
import { BookingStatus, TimeSlotStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { account, activeUniversityId } = await requireTenant(req);
        assertRole(account.role, ["CONSULTANT", "HEAD_CONSULTANT"]);

        const bookingId = Number(params.id);
        if (!Number.isFinite(bookingId)) {
            return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
        }

        // Load booking to verify status
        const booking = await prisma.booking.findUnique({
            where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } },
            select: { booking_status: true, time_slot_id: true }
        });

        if (!booking) {
            return NextResponse.json({ success: false, error: "ไม่พบรายการจอง" }, { status: 404 });
        }

        if (booking.booking_status !== "IN_PROGRESS") {
            return NextResponse.json({ success: false, error: "สถานะการจองต้องเป็น IN_PROGRESS" }, { status: 400 });
        }

        // Load attendance
        const attendance = await prisma.bookingAttendance.findUnique({
            where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } }
        });

        if (attendance?.booking_attendance_status !== "NO_SHOW") {
            return NextResponse.json({ success: false, error: "สถานะการเข้าพบต้องเป็น NO_SHOW จึงจะยกเลิกแบบนี้ได้" }, { status: 400 });
        }

        // Find "OTHER" cancellation reason or fallback to first
        let reason = await prisma.cancellationReason.findUnique({
            where: { cancellation_reason_code: "OTHER" }
        });
        if (!reason) {
            reason = await prisma.cancellationReason.findFirst();
        }
        const reasonId = reason?.cancellation_reason_id ?? 1;

        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } },
                data: { booking_status: BookingStatus.CANCELLED }
            });

            await tx.bookingCancellation.upsert({
                where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } },
                update: {
                    cancellation_reason_id: reasonId,
                    booking_cancellation_cancelled_by_id: account.accountId,
                    booking_cancellation_note: "ผู้ให้คำปรึกษายกเลิกเนื่องจากนิสิตไม่มาตามนัด (No Show)",
                },
                create: {
                    university_id: activeUniversityId,
                    booking_id: bookingId,
                    cancellation_reason_id: reasonId,
                    booking_cancellation_cancelled_by_id: account.accountId,
                    booking_cancellation_note: "ผู้ให้คำปรึกษายกเลิกเนื่องจากนิสิตไม่มาตามนัด (No Show)",
                }
            });

            // Update time slot status
            const slot = await tx.timeSlot.findUnique({
                where: { university_id_time_slot_id: { university_id: activeUniversityId, time_slot_id: booking.time_slot_id } },
                select: { time_slot_id: true, time_slot_max_capacity: true }
            });

            if (slot) {
                const activeCount = await tx.booking.count({
                    where: {
                        university_id: activeUniversityId,
                        time_slot_id: slot.time_slot_id,
                        booking_status: { in: [BookingStatus.PENDING_ASSIGNMENT, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] }
                    }
                });
                const cap = Number(slot.time_slot_max_capacity ?? 0);
                const nextStatus = activeCount < cap ? TimeSlotStatus.OPEN : TimeSlotStatus.FULL;

                await tx.timeSlot.update({
                    where: { university_id_time_slot_id: { university_id: activeUniversityId, time_slot_id: slot.time_slot_id } },
                    data: { time_slot_status: nextStatus }
                });
            }
        });

        return NextResponse.json({ success: true, status: BookingStatus.CANCELLED });
    } catch (err: any) {
        console.error("[PATCH /cancel-no-show]", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
