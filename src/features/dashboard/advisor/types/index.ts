// features/dashboard/advisor/types/index.ts

export type StudentRiskLevel = 'NORMAL' | 'WATCH' | 'HIGH_RISK';

export interface AdvisorStudent {
  id: string; // student_id (e.g. 64010001)
  name: string;
  firstName: string;
  lastName: string;
  riskLevel: StudentRiskLevel;
  lastAppointment: Date | null;
  status: string;
}

export interface AdvisorStats {
  totalStudents: number;
  appointmentsToday: number;
  highRiskCount: number;
}

export interface AdvisorDashboardFilters {
  search?: string;
  riskLevel?: string;
  startDate?: Date;
  endDate?: Date;
  problemCategoryId?: number;
  gender?: string;
}
