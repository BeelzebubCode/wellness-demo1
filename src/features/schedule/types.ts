// src/features/schedule/types.ts

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'CANCELLED';

export interface TimeSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  startDatetime: string;
  endDatetime: string;
  status: SlotStatus;
  maxCapacity: number;
  currentBookings: number;
  bookings?: SlotBooking[];
}

export interface SlotBooking {
  id: number;
  studentName: string;
  studentCode?: string;
  problemType: string;
  status: string;
}

export interface CreateSlotDTO {
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
}

export interface AutoGenerateSlotDTO {
  date: string;
  startHour: number;
  endHour: number;
  slotDuration: number; // minutes
  maxCapacity?: number;
}

export interface DaySchedule {
  date: string;
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}