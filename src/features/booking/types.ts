// src/features/booking/types.ts
import type { TimeSlotCore } from "@/shared/types/timeSlot";

export type BookingStatus =
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

// ✅ booking ต้องการ slot + consultant info บางกรณี
export type BookingTimeSlot = Omit<
  TimeSlotCore,
  // booking บางหน้ามันไม่จำเป็นต้องรู้ครบ แต่การมีไว้ไม่เสียหาย
  never
> & {
  consultantId?: number;
  consultantName?: string | null;
};

export interface Booking {
  id: number;
  studentId: number;
  studentName: string;
  problemType: string;
  problemCategoryId: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  hasFeedback?: boolean;
}

export interface MyBooking {
  id: number;
  status: BookingStatus;
  problemType: string | null;

  createdAt: string | null;
  updatedAt: string | null;

  date: string | null;
  startTime: string | null;
  endTime: string | null;

  hasFeedback?: boolean;
}

export interface BookingDetail extends Booking {
  student: {
    id: number;
    code?: string;
    name: string;
    email?: string;
    phone?: string;
    faculty?: string;
    department?: string;
    lineId?: string;
  };
  consultant?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
  };

  // ✅ เปลี่ยนตรงนี้
  timeSlots: BookingTimeSlot[];

  outcome?: {
    note: string;
    nextStep?: string;
    riskLevel?: number;
    recordedAt: string;
  };
}

export interface CreateBookingDTO {
  studentCode: string;
  timeSlotId: number;
  problemCategoryId: number;
  detailText?: string;
}

export interface ProblemCategory {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string;
  description?: string;
}
