// src/features/booking/types.ts

export type BookingStatus = 
  | 'PENDING_ASSIGNMENT' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface TimeSlot {
  id: number;
  date: string;

  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;

  maxCapacity: number;
  bookedCount: number;
  availableCount: number;

  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'CANCELLED';

  // 🔑 UI + API ใช้จริง
  isAvailable: boolean;
  isClosed: boolean;
}


export interface Booking {
  id: number;
  studentId: number;
  studentName: string;
  studentCode?: string;
  consultantId?: number;
  consultantName?: string;
  problemType: string;
  problemCategoryId: number;
  detailText?: string;
  status: BookingStatus;
  date?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
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
  lineUserId?: string;
  studentCode?: string;
  timeSlotId: number;      
  problemCategoryId?: number;
  detailText?: string;
}

export interface ProblemCategory {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string;
  description?: string;
}