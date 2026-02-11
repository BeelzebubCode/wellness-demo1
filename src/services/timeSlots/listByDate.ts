// src/services/timeSlots/listByDate.ts
import prisma from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES, UnavailableReason } from "./constants";
import { fmtDateBkk, fmtTimeBkk, getDayRangeBangkok } from "./utils";
import { TimeSlotStatus } from "@prisma/client";

/**
 * 🚀 PERFORMANCE OPTIMIZED: Fetch time slots with booking counts
 * 
 * Optimizations:
 * - Uses single raw SQL query with LEFT JOIN + GROUP BY instead of 2 separate queries
 * - Relies on idx_timeslot_university_datetime for fast slot lookup
 * - Relies on idx_booking_timeslot_status for fast booking aggregation
 * - Expected improvement: 2-3x faster than previous groupBy approach
 * 
 * @param dateStr - Date in YYYY-MM-DD format
 * @param universityId - University ID to filter slots
 */
export async function listTimeSlotsByDate(
  dateStr: string,
  universityId: number,
  opts?: { autoGenerateIfEmpty?: boolean }
) {
  const startTime = Date.now();
  
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

  // 🚀 OPTIMIZED: Single query with aggregation using raw SQL
  // This eliminates the N+1 problem from the previous approach
  // Relies on:
  // - idx_timeslot_university_datetime (time_slot WHERE clause)
  // - idx_booking_timeslot_status (booking count aggregation)
  const slotsWithCounts = await prisma.$queryRaw<
    Array<{
      time_slot_id: number;
      university_id: number;
      time_slot_start_datetime: Date;
      time_slot_end_datetime: Date;
      time_slot_max_capacity: number;
      time_slot_status: string;
      active_bookings: bigint | null;
    }>
  >`
    SELECT 
      ts.time_slot_id,
      ts.university_id,
      ts.time_slot_start_datetime,
      ts.time_slot_end_datetime,
      ts.time_slot_max_capacity,
      ts.time_slot_status,
      COUNT(b.booking_id) FILTER (
        WHERE b.booking_status IN ('PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
      ) as active_bookings
    FROM time_slot ts
    LEFT JOIN booking b ON b.time_slot_id = ts.time_slot_id 
      AND b.university_id = ts.university_id
    WHERE ts.university_id = ${uniId}
      AND ts.time_slot_start_datetime >= ${startOfDay}
      AND ts.time_slot_start_datetime <= ${endOfDay}
    GROUP BY ts.time_slot_id, ts.university_id, ts.time_slot_start_datetime, 
             ts.time_slot_end_datetime, ts.time_slot_max_capacity, ts.time_slot_status
    ORDER BY ts.time_slot_start_datetime ASC
  `;

  const elapsed = Date.now() - startTime;
  
  // 🔍 Log slow queries (>100ms) without PII
  if (elapsed > 100) {
    console.warn(
      `[SLOW QUERY] listTimeSlotsByDate took ${elapsed}ms (date=${ds}, universityId=${uniId}, slots=${slotsWithCounts.length})`
    );
  }

  if (opts?.autoGenerateIfEmpty && slotsWithCounts.length === 0) {
    // ไม่ generate ใน service นี้
  }

  const now = Date.now();

  return slotsWithCounts.map((slot) => {
    // Convert BigInt to number for active bookings count
    const activeBookings = Number(slot.active_bookings ?? 0);

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
