// src/features/consultant/shifts/types.ts

export interface BorrowShift {
  borrowShiftId: number;
  borrowPlanId: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  homeUniversity: {
    nameTh: string;
    nameEn: string;
  };
  targetUniversity: {
    id: number;
    nameTh: string;
    nameEn: string;
    code: string;
  };
  createdAt: string;
  completedAt: string | null;
}

export interface MyScheduleResponse {
  success: boolean;
  data?: {
    currentShift: BorrowShift | null; // e.g. ACTIVE
    historyShifts: BorrowShift[];     // e.g. COMPLETED / CANCELLED
  };
  error?: string;
}
