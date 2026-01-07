// src/features/booking/types.ts

export type BookingStatus = 
  | 'PENDING_ASSIGNMENT' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface TimeSlot { 
  id: number;                 // ✅ ให้ตรงกับ API
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  // (optional) ถ้า UI ใช้
  date?: string;
  startDateTime?: string;
  endDateTime?: string;
  maxCapacity?: number;
  bookedCount?: number;
  availableCount?: number;
  status?: string;
  isClosed?: boolean;
}


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
  timeSlots: TimeSlot[];
  outcome?: {
    note: string;
    nextStep?: string;
    riskLevel?: number;
    recordedAt: string;
  };
}

export interface CreateBookingDTO {
  studentCode: string;          // ✅ บังคับ
  timeSlotId: number;
  problemCategoryId: number;    // ✅ API ต้องใช้
  detailText?: string;
}

export interface ProblemCategory {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string;
  description?: string;
}