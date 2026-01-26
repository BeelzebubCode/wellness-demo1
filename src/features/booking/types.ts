// src/features/booking/types.ts
import type { TimeSlotCore } from "@/shared/types/timeSlot";
import type {
  BookingCore,
  BookingStatus,
  BookingOutcomeCore,
  BookingCancellationCore,
} from "@/shared/types/booking";

export type { BookingStatus };

// ✅ booking ต้องการ slot + consultant info บางกรณี
export type BookingTimeSlot = TimeSlotCore & {
  consultantId?: number | null;
  consultantName?: string | null;
    // ✅ เพิ่ม 2 บรรทัดนี้
  outcome?: BookingOutcomeCore | null;
};

// ✅ (หน้า student list / หน้าทั่วไปที่อยากใช้แบบง่าย)
export interface BookingListItem extends Omit<BookingCore, "date" | "startTime" | "endTime"> {
  studentId: number;
  studentName: string;

  problemType: string;
  problemCategoryId: number;

  // optional schedule (บาง list ไม่ join slot)
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;

  hasFeedback?: boolean;
}

// ✅ (หน้า My booking)
export interface MyBooking extends Pick<BookingCore, "id" | "status" | "date" | "startTime" | "endTime" | "createdAt" | "updatedAt"> {
  problemType: string | null;
  hasFeedback?: boolean;
}

// ✅ (หน้า detail)
export interface BookingDetail extends BookingCore {
  problemType: string;
  problemCategoryCode?: string;
  detailText?: string | null;

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
  } | null;

  timeSlots?: BookingTimeSlot[];

  outcome?: BookingOutcomeCore | null;
  cancellation?: BookingCancellationCore | null;

  hasFeedback?: boolean;
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

export type TimeSlot = BookingTimeSlot;
