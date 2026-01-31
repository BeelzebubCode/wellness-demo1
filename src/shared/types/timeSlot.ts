// src/shared/types/timeSlot.ts

export type DayStatus = "OPEN" | "CLOSED";

// ✅ ให้ตรงกับ Prisma enum ใหม่
export type SlotStatus = "OPEN" | "CLOSED" | "CANCELLED" | "FULL";

// ✅ เหตุผลที่ “จองไม่ได้” (FULL = เต็ม, CLOSED = ปิด, PAST_TIME = หมดเวลา)
export type UnavailableReason =
  | "PAST_TIME"
  | "FULL"
  | "CLOSED"
  | "CANCELLED"
  | "UNAVAILABLE";


export interface TimeSlotCore {
  id: number;

  // tenant
  universityId: number;

  // time
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  startDateTime?: string;
  endDateTime?: string;

  // capacity
  maxCapacity: number;
  bookedCount: number;
  availableCount: number;

  // state
  status: SlotStatus;

  // ✅ derived booleans (แนะนำให้คำนวณจาก status + count + time)
  isAvailable: boolean; // status=OPEN && !isPastTime && availableCount>0
  isClosed: boolean;    // status===CLOSED || status===CANCELLED
  isPastTime: boolean;

  unavailableReason?: UnavailableReason | null;
}
