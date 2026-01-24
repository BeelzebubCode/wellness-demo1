// src/services/timeSlots/listByDate.ts
import prisma from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES, UnavailableReason } from "./constants";
import { fmtDateBkk, fmtTimeBkk, getDayRangeBangkok } from "./utils";

export async function listTimeSlotsByDate(dateStr: string, universityId: number, opts?: { autoGenerateIfEmpty?: boolean }) {
  const { start: startOfDay, end: endOfDay } = getDayRangeBangkok(dateStr);

  let timeSlots = await prisma.timeSlot.findMany({
    where: {
      university_id: universityId,
      time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { time_slot_start_datetime: "asc" },
  });

  if (opts?.autoGenerateIfEmpty && timeSlots.length === 0) {
    // ให้ route ไปเรียก generate ก่อนแล้วค่อยมา list ซ้ำก็ได้
    // แต่เพื่อความสะดวก เรา "ไม่ generate ใน service นี้"
  }

  const slotIds = timeSlots.map((s) => s.time_slot_id);

  const bookingCounts = slotIds.length
    ? await prisma.booking.groupBy({
        by: ["time_slot_id"],
        where: {
          time_slot_id: { in: slotIds },
          booking_status: { in: ACTIVE_BOOKING_STATUSES as any },
        },
        _count: { _all: true },
      })
    : [];

  const countMap = new Map<number, number>();
  for (const row of bookingCounts) countMap.set(row.time_slot_id, row._count._all);

  const now = Date.now();

  const slots = timeSlots.map((slot) => {
    const activeBookings = countMap.get(slot.time_slot_id) ?? 0;

    const maxCap = Number(slot.time_slot_max_capacity ?? 0);
    const availableCount = Math.max(0, maxCap - activeBookings);

    const isClosed =
      slot.time_slot_status === "LOCKED" ||
      slot.time_slot_status === "CANCELLED" ||
      slot.time_slot_status !== "AVAILABLE";

    const slotStart = slot.time_slot_start_datetime;
    const slotEnd = slot.time_slot_end_datetime;

    const isPastTime = slotEnd.getTime() <= now;
    const isAvailable = !isClosed && availableCount > 0 && !isPastTime;

    let unavailableReason: UnavailableReason | null = null;
    if (!isAvailable) {
      if (isPastTime) unavailableReason = "PAST_TIME";
      else if (isClosed) unavailableReason = "CLOSED";
      else if (availableCount <= 0) unavailableReason = "FULL";
      else unavailableReason = "UNAVAILABLE";
    }

    return {
      id: slot.time_slot_id,
      universityId: slot.university_id,

      date: fmtDateBkk(slotStart),
      startTime: fmtTimeBkk(slotStart),
      endTime: fmtTimeBkk(slotEnd),

      startDateTime: slotStart.toISOString(),
      endDateTime: slotEnd.toISOString(),

      maxCapacity: maxCap,
      bookedCount: activeBookings,
      availableCount,
      status: slot.time_slot_status,

      isAvailable,
      isClosed,
      isPastTime,
      unavailableReason,
    };
  });

  return slots;
}
