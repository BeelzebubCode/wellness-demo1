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

export interface ShiftCycleConfig {
  epochDate: string;
  cycleDays: number;
  teamLengthDays: number;
}

export interface MyScheduleResponse {
  success: boolean;
  data?: {
    teamId: number | null;
    teamOrder: number | null;
    teamName: string | null;
    config: ShiftCycleConfig;
    borrowShifts: BorrowShift[];
  };
  error?: string;
}
