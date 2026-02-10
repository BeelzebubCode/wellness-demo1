// src/features/consultant/shifts/types.ts

export interface ShiftBorrowPeriod {
  periodId: number;
  borrowedToUniversity: {
    nameTh: string;
    nameEn: string;
    code: string;
  };
  startDate: string;
  endDate: string;
  actualReturnDate: string | null;
  status: "ACTIVE" | "RETURNED" | "CANCELLED";
}

export interface ConsultantShift {
  shiftId: number;
  startDate: string;
  endDate: string;
  daysWorked: number;
  daysRemaining: number;
  status: "ACTIVE" | "ON_LOAN" | "COMPLETED" | "CANCELLED";
  homeUniversity: {
    nameTh: string;
    nameEn: string;
  };
  borrowPeriods: ShiftBorrowPeriod[];
  createdAt: string;
  completedAt: string | null;
}

export interface MyScheduleResponse {
  success: boolean;
  data?: {
    currentShift: ConsultantShift | null;
    upcomingShifts: ConsultantShift[];
    completedShifts: ConsultantShift[];
  };
  error?: string;
}
