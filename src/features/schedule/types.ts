// src/features/schedule/types.ts
import type { TimeSlotCore, DayStatus, SlotStatus } from "@/shared/types/timeSlot";

export type { DayStatus, SlotStatus };

// schedule ใช้เท่าที่มีใน core เลย
export type TimeSlot = TimeSlotCore;

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
  // v2 PATCH /time-slots/:id ตอนนี้รองรับแค่นี้
  capacity?: number;
  isAvailable?: boolean;
  status?: SlotStatus; // ✅ เพิ่มได้ (เพราะ backend รองรับ)
  startTime?: string;
  endTime?: string;
}
