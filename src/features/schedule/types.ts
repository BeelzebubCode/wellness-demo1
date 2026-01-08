// src/features/schedule/types.ts

export type DayStatus = "OPEN" | "CLOSED";

export type SlotStatus = "AVAILABLE" | "LOCKED" | "CANCELLED";

export interface TimeSlot {
  id: number;             
  date: string;               // "YYYY-MM-DD"
  startTime: string;          // "HH:mm"
  endTime: string;            // "HH:mm"
  startDateTime?: string;
  endDateTime?: string;

  maxCapacity: number;
  bookedCount: number;
  availableCount: number;

  status: SlotStatus;
  isAvailable: boolean;
  isClosed: boolean;
  isPastTime: boolean;

  unavailableReason?: "PAST_TIME" | "FULL" | "CLOSED" | "UNAVAILABLE" | null;
}

export interface CreateSlotDTO {
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
}

export interface AutoGenerateSlotDTO {
  date: string;
  maxCapacity?: number;
}

export interface UpdateSlotDTO {
  startTime?: string;
  endTime?: string;
  capacity?: number;     // map -> time_slot_max_capacity
  isAvailable?: boolean; // map -> AVAILABLE / LOCKED
}
