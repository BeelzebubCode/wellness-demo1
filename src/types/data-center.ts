export type BookingStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'CONFIRMED';

export interface DataCenterFilter {
  // ===== Global =====
  search?: string;

  // ===== Student =====
  facultyId?: number;
  departmentId?: number;
  year?: number;
  degree?: string;
  studentCode?: string;
  bookingCountMin?: number;
  noShowCountMin?: number;
  isRepeatTopic?: boolean;

  // ===== Consultant =====
  consultantName?: string;
  specialization?: string;
  organizationId?: number;
  activeQueueMin?: number;
  workloadMin?: number;
  avgDurationMin?: number;
  ratingMin?: number;

  // ===== Problem =====
  problemCategoryId?: number;

  // ===== Booking =====
  status?: BookingStatus | 'ALL';
  startDate?: string;
  endDate?: string;
  timeRange?: 'MORNING' | 'AFTERNOON' | 'EVENING';
}


/**
 * ✅ Shape สำหรับ ConsultationTable
 */
export interface DataCenterItem {
  id: number;

  // student
  studentName: string;
  studentId?: string;
  faculty?: string;
  degree?: string;
  year?: number;

  // booking
  status: BookingStatus;
  problemType: string;
  isRepeatTopic: boolean;
  date: string;       // display-ready
  timeSlot: string;   // display-ready

  // consultant
  consultantName: string;
  expertise?: string;
  currentLoad: number;
  satisfactionScore?: number | string;

  // stats
  bookingCount: number;
  noShowCount: number;
}

export interface DataCenterResponse {
  data: DataCenterItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
