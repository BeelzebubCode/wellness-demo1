// src/features/data-center/types.ts

// ==========================================
// 📌 Data Center Types
// ==========================================

export type DataCenterCategory = 
  | 'STUDENTS' 
  | 'CONSULTANTS' 
  | 'CATEGORIES' 
  | 'BOOKINGS';

// ---------------- Filter ----------------
export interface DataCenterFilter {
  search?: string;
  
  // Common
  startDate?: string;
  endDate?: string;
  
  // Students
  facultyId?: number;
  departmentId?: number;
  year?: number;
  degree?: string;
  studentCode?: string;
  bookingCountMin?: number;
  noShowCountMin?: number;
  
  // Consultants
  organizationId?: number;
  specialization?: string;
  activeQueueMin?: number;
  ratingMin?: number;
  
  // Categories
  // (ไม่มี filter พิเศษ)
  
  // Bookings
  status?: 'ALL' | 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  problemCategoryId?: number;
}

// ... (ส่วนอื่นเหมือนเดิม)

// ---------------- Student ----------------
export interface StudentItem {
  id: number;
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  faculty: string | null;
  department: string | null;
  year: number | null;
  degree: string | null;
  bookingCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  lastBookingDate: string | null;
}

export interface StudentDetail extends StudentItem {
  advisor: string | null;
  addresses: {
    type: string;
    detail: string;
    province: string;
  }[];
  bookings: {
    id: number;
    date: string;
    time: string;
    status: string;
    problemType: string;
    consultantName: string;
  }[];
}

// ---------------- Consultant ----------------
export interface ConsultantItem {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  organization: string;
  specializations: string[];
  languages: string[];
  activeQueueCount: number;
  totalBookings: number;
  completedBookings: number;
  avgRating: number | null;
  createdAt: string;
}

export interface ConsultantDetail extends ConsultantItem {
  recentBookings: {
    id: number;
    date: string;
    studentName: string;
    problemType: string;
    status: string;
  }[];
  ratings: {
    criterion: string;
    avgScore: number;
    count: number;
  }[];
}

// ---------------- Category ----------------
export interface CategoryItem {
  id: number;
  code: string;
  nameTh: string;
  nameEn: string | null;
  description: string | null;
  totalBookings: number;
  pendingCount: number;
  completedCount: number;
}

export interface CategoryDetail extends CategoryItem {
  monthlyStats: {
    month: string;
    count: number;
  }[];
  topConsultants: {
    id: number;
    name: string;
    count: number;
  }[];
}

// ---------------- Booking ----------------
export interface BookingItem {
  id: number;
  date: string;
  timeSlot: string;
  status: string;
  studentName: string;
  studentCode: string | null;
  consultantName: string;
  problemType: string;
  createdAt: string;
}

export interface BookingDetail extends BookingItem {
  detailText: string | null;
  student: {
    id: number;
    code: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    faculty: string | null;
    department: string | null;
  };
  consultant: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    organization: string | null;
  } | null;
  outcome: {
    note: string;
    nextStep: string | null;
    riskLevel: number | null;
    recordedAt: string;
  } | null;
  cancellation: {
    reason: string;
    cancelledBy: string;
    cancelledAt: string;
  } | null;
}

// ---------------- Response ----------------
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}