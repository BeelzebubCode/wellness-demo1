// src/features/booking/utils/normalizeTimeSlot.ts
import type { TimeSlotCore, SlotStatus, UnavailableReason } from "@/shared/types/timeSlot";
import type { TimeSlot } from "@/features/booking/types"; // raw type จาก api

function pad2(n: number) {
  return String(n).padStart(2, "0");
}


function fmtHHmm(d: Date) {
  // ✅ Force Asia/Bangkok timezone
  return d.toLocaleTimeString("en-GB", { 
    timeZone: "Asia/Bangkok", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

function fmtISODate(d: Date) {
  // ✅ Force Asia/Bangkok date
  // en-CA gives YYYY-MM-DD format
  return d.toLocaleDateString("en-CA", { 
    timeZone: "Asia/Bangkok" 
  });
}

export function normalizeTimeSlot(raw: TimeSlot, now: Date): TimeSlotCore {
  // ✅ 1) ดึง id/universityId
  const id = Number((raw as any).id ?? (raw as any).time_slot_id);
  const universityId = Number((raw as any).universityId ?? (raw as any).university_id);

  // ✅ 2) start/end datetime (รองรับทั้ง string/Date)
  const startDT = new Date((raw as any).startDateTime ?? (raw as any).time_slot_start_datetime);
  const endDT = new Date((raw as any).endDateTime ?? (raw as any).time_slot_end_datetime);

  // ✅ 3) status (map ให้เป็น SlotStatus)
  const status = String((raw as any).status ?? (raw as any).time_slot_status ?? "OPEN") as SlotStatus;

  // ✅ 4) capacity
  const maxCapacity = Number((raw as any).maxCapacity ?? (raw as any).time_slot_max_capacity ?? 1);
  const bookedCount = Number((raw as any).bookedCount ?? (raw as any).booked_count ?? 0);
  const availableCount = Math.max(0, maxCapacity - bookedCount);

  // ✅ 5) derived flags
  const isPastTime = startDT.getTime() < now.getTime();
  const isClosed = status === "CLOSED" || status === "CANCELLED";
  const isAvailable = status === "OPEN" && !isPastTime && availableCount > 0;

  // ✅ 6) reason
  let unavailableReason: UnavailableReason | null = null;
  if (!isAvailable) {
    if (isPastTime) unavailableReason = "PAST_TIME";
    else if (status === "FULL" || availableCount <= 0) unavailableReason = "FULL";
    else if (status === "CLOSED") unavailableReason = "CLOSED";
    else if (status === "CANCELLED") unavailableReason = "CANCELLED";
    else unavailableReason = "UNAVAILABLE";
  }

  return {
    id,
    universityId,

    date: fmtISODate(startDT),
    startTime: fmtHHmm(startDT),
    endTime: fmtHHmm(endDT),

    startDateTime: startDT.toISOString(),
    endDateTime: endDT.toISOString(),

    maxCapacity,
    bookedCount,
    availableCount,

    status,
    isAvailable,
    isClosed,
    isPastTime,
    unavailableReason,
  };
}
