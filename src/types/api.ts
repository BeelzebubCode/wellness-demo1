// ==========================================
// 📌 Types - API
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BookingFilters {
  date?: string;
  status?: string;
  consultantId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdminLoginDTO {
  username: string;
  password: string;
}

export interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  consultantId?: string;
}

export interface StatsData {
  totalBookings: number;
  confirmed: number;
  assigned: number;
  completed: number;
  cancelled: number;
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  byConsultant: { name: string; count: number }[];
  byProblemType: { type: string; count: number }[];
  recentDays: { date: string; count: number }[];
}
