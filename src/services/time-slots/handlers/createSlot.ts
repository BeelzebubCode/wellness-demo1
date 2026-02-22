// src/services/time-slots/handlers/createSlot.ts
import prisma from "@/lib/prisma";
import { TimeSlotStatus } from "@prisma/client";
import { createDateTime, getDayRangeBangkok } from "./utils";

export type CreateSlotBody = {
    date: string;
    startTime: string;
    endTime: string;
    maxCapacity: number;
};

export async function createTimeSlot(
    universityId: number,
    body: CreateSlotBody
) {
    const { date, startTime, endTime, maxCapacity } = body;

    if (!date || !startTime || !endTime) {
        return { ok: false as const, status: 400, error: "Missing required fields" };
    }

    if (maxCapacity < 1) {
        return { ok: false as const, status: 400, error: "Capacity must be at least 1" };
    }

    const startDateTime = createDateTime(date, startTime);
    const endDateTime = createDateTime(date, endTime);

    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
        return { ok: false as const, status: 400, error: "Invalid date or time format" };
    }

    if (startDateTime >= endDateTime) {
        return { ok: false as const, status: 400, error: "End time must be after start time" };
    }

    // Ensure it doesn't overlap with existing slots in this university
    const overlappingSlots = await prisma.timeSlot.findMany({
        where: {
            university_id: universityId,
            time_slot_start_datetime: { lt: endDateTime },
            time_slot_end_datetime: { gt: startDateTime },
        },
    });

    if (overlappingSlots.length > 0) {
        const slotIds = overlappingSlots.map(s => s.time_slot_id);
        const activeBookingsCount = await prisma.booking.count({
            where: {
                time_slot_id: { in: slotIds },
                booking_status: { not: "CANCELLED" }
            }
        });

        if (activeBookingsCount > 0) {
            return { ok: false as const, status: 409, error: "ช่วงเวลาที่เลือกทับซ้อนกับช่วงเวลาที่มีการจองแล้ว" };
        }

        const hasOpenOverlap = overlappingSlots.some(s => s.time_slot_status !== TimeSlotStatus.CLOSED);
        if (hasOpenOverlap) {
            return { ok: false as const, status: 409, error: "ช่วงเวลาที่เลือกทับซ้อนกับช่วงเวลาอื่นที่เปิดอยู่" };
        }

        // All overlaps are CLOSED and have 0 bookings. Delete them to make room.
        await prisma.timeSlot.deleteMany({
            where: { time_slot_id: { in: slotIds } }
        });
    }

    // Pre-fetch day periods for this university to assign the correct one
    const periods = await prisma.dayPeriod.findMany({
        where: { university_id: universityId, is_active: true }
    });

    const periodMap = new Map<string, number>();
    for (const p of periods) {
        periodMap.set(p.day_period_code, p.day_period_id);
    }

    function getDayPeriodCode(hour: number): string {
        if (hour >= 8 && hour < 12) return "MORNING";
        if (hour >= 12 && hour < 16) return "AFTERNOON";
        if (hour >= 16 && hour < 20) return "EVENING";
        return "EVENING";
    }

    const localHour = (startDateTime.getUTCHours() + 7) % 24;
    const code = getDayPeriodCode(localHour);
    const dayPeriodId = periodMap.get(code) ?? null;

    const slot = await prisma.timeSlot.create({
        data: {
            university_id: universityId,
            time_slot_start_datetime: startDateTime,
            time_slot_end_datetime: endDateTime,
            time_slot_max_capacity: maxCapacity,
            time_slot_status: TimeSlotStatus.OPEN,
            day_period_id: dayPeriodId,
        },
    });

    return { ok: true as const, slot };
}
