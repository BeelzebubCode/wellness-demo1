// src/services/timeSlots/listByDate.ts
import prisma from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES, UnavailableReason } from "./constants";
import { fmtDateBkk, fmtTimeBkk, getDayRangeBangkok } from "./utils";
import { TimeSlotStatus } from "@prisma/client";

export async function listTimeSlotsByDate(
  dateStr: string,
  universityId: number,
  opts?: { autoGenerateIfEmpty?: boolean }
) {
  // ------------------------------
  // guards (กัน 500 จาก input เพี้ยน)
  // ------------------------------
  const ds = String(dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
    throw Object.assign(new Error("Invalid date (expected YYYY-MM-DD)"), {
      status: 400,
    });
  }
  const uniId = Number(universityId);
  if (!Number.isFinite(uniId) || uniId <= 0) {
    throw Object.assign(new Error("Invalid universityId"), { status: 400 });
  }

  const { start: startOfDay, end: endOfDay } = getDayRangeBangkok(ds);

  const timeSlots = await prisma.timeSlot.findMany({
    where: {
      university_id: uniId,
      time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { time_slot_start_datetime: "asc" },
  });

  if (opts?.autoGenerateIfEmpty && timeSlots.length === 0) {
    // ไม่ generate ใน service นี้
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
  for (const row of bookingCounts) {
    countMap.set(row.time_slot_id, row._count._all);
  }

  const now = Date.now();

  return timeSlots.map((slot) => {
    const activeBookings = countMap.get(slot.time_slot_id) ?? 0;

    const maxCap = Number(slot.time_slot_max_capacity ?? 0);
    const availableCount = Math.max(0, maxCap - activeBookings);

    // ✅ ใช้ enum ของ Prisma ตรง ๆ
    const st = slot.time_slot_status as TimeSlotStatus;

    const isCancelled = st === TimeSlotStatus.CANCELLED;
    const isClosedOnly = st === TimeSlotStatus.CLOSED;
    const isFullByStatus = st === TimeSlotStatus.FULL;

    const slotStart = slot.time_slot_start_datetime;
    const slotEnd = slot.time_slot_end_datetime;

    const isPastTime = slotEnd.getTime() <= now;

    const isAvailable =
      !isPastTime &&
      !isClosedOnly &&
      !isCancelled &&
      !isFullByStatus &&
      availableCount > 0;

    let unavailableReason: UnavailableReason | null = null;

    if (!isAvailable) {
      if (isPastTime) unavailableReason = "PAST_TIME";
      else if (isCancelled) unavailableReason = "CANCELLED";
      else if (isClosedOnly) unavailableReason = "CLOSED";
      else if (availableCount <= 0 || isFullByStatus) unavailableReason = "FULL";
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

      // ✅ ส่ง enum ใหม่ตรง ๆ
      status: st,

      isAvailable,
      // UI มอง Cancelled เป็น "ปิด" ด้วย
      isClosed: isClosedOnly || isCancelled,
      isPastTime,
      unavailableReason,
    };
  });
}
