// src/shared/types/timeSlot.ts

export type DayStatus = "OPEN" | "CLOSED";

export type SlotStatus = "AVAILABLE" | "LOCKED" | "CANCELLED" | "BOOKED";

export type UnavailableReason = "PAST_TIME" | "FULL" | "CLOSED" | "UNAVAILABLE";

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
  isAvailable: boolean;
  isClosed: boolean;
  isPastTime: boolean;
  unavailableReason?: UnavailableReason | null;
}
