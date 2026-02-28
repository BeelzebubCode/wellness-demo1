// src/features/dashboard/shared/analytics-types.ts

// ─── Query Params ───────────────────────────────────────────────────────────
export interface AnalyticsParams {
    date_start?: string;   // ISO date e.g. "2026-01-01"
    date_end?: string;     // ISO date e.g. "2026-01-31"
    all_time?: boolean;
    region_id?: number;       // Ministry/SuperAdmin only
    province_id?: number;     // Ministry/SuperAdmin only
    university_type?: string; // Ministry/SuperAdmin only: SUPERVISED, PUBLIC, PRIVATE
    university_id?: number;   // Ministry/SuperAdmin only
    university_code?: string; // Ministry/SuperAdmin only
    faculty_id?: number;
    faculty_ids?: number[];
    faculty_code?: string; // e.g. "AGR" — backend resolves to faculty_id
    department_id?: number;
    gender?: string[];             // multi-value e.g. ["MALE","FEMALE"]
    problem_category_ids?: number[];  // multi-value e.g. [1,3,5]
    booking_status?: string[];     // multi-value e.g. ["COMPLETED","CANCELLED"]
    service_mode?: string[];       // multi-value e.g. ["ONLINE","ONSITE"]
    attendance_status?: string[];  // multi-value e.g. ["CHECKED_IN","LATE","NO_SHOW"]
    online_channel_category_id?: number;

    // Head-department specific filters
    family_income_bracket?: string[];  // e.g. ["UNDER_100K", "BETWEEN_100K_200K"]
    blood_group?: string[];            // e.g. ["A", "B"]
    birth_order?: string[];            // e.g. ["ONLY_CHILD", "1", "2", "3", "4_PLUS"]
    chronic_condition_ids?: number[];   // e.g. [1, 5, 10]
    parental_status?: string[];        // e.g. ["TOGETHER", "DIVORCED"]
}

// ─── KPI Summary ────────────────────────────────────────────────────────────
export interface SummaryStats {
    totalBookings: number;
    cancelledCount: number;
    checkedInCount: number;
    lateCount: number;
    noShowCount: number;
    checkedInRate: number;
    lateRate: number;
    noShowRate: number;
    avgRisk: number | null;
    highRiskRate: number;   // risk >= 4
    mentalHealthCount: number; // [NEW] Count of Mental Health cases
    completedCount: number;    // [NEW] Count of completed bookings
    totalWithRisk: number;      // [NEW] Total bookings that have a risk level assigned
    highRiskCount: number;      // [NEW] Count of risk level 4-5
}

// ─── Load/Stress Index ──────────────────────────────────────────────────────
export interface LoadIndexItem {
    groupId: number;
    groupCode: string;
    groupName: string;
    totalBookings: number;
    highRiskCount: number;
    noShowCount: number;
    lateCount: number;
    cancelledCount: number;
    loadIndex: number;
    mentalHealthCount: number; // [NEW] Count of Mental Health cases
    completedCount: number;   // [NEW] Count of completed bookings
}

// ─── Problem Category ───────────────────────────────────────────────────────
export interface ProblemCategoryItem {
    categoryId: number;
    categoryCode: string;
    categoryNameTh: string;
    categoryNameEn: string | null;
    count: number;
    genderBreakdown: {
        male: number;
        female: number;
        lgbtq: number;
        unknown: number;
    };
    rank: number;
}

// ─── Attendance ─────────────────────────────────────────────────────────────
export interface AttendanceGroupItem {
    groupId: number;
    groupCode: string;
    groupName: string;
    checkedIn: number;
    late: number;
    noShow: number;
    total: number;
    checkedInRate: number;
    lateRate: number;
    noShowRate: number;
}

// ─── Cancellation ───────────────────────────────────────────────────────────
export interface CancellationGroupItem {
    groupId: number;
    groupCode: string;
    groupName: string;
    cancelledCount: number;
    cancelRate: number;
    topReasons: { reasonId: number; reasonName: string; count: number }[];
}

// ─── Risk Distribution ──────────────────────────────────────────────────────
export interface RiskDistribution {
    levels: { level: number; count: number; rate: number }[];
    avgRisk: number | null;
    highRiskRate: number;
    highRiskCount: number;
    totalWithRisk: number;
}

// ─── Time Trend ─────────────────────────────────────────────────────────────
export interface TrendBucket {
    bucket: string;          // "2026-01-15" | "2026-W03" | "2026-01"
    totalBookings: number;
    cancelledCount: number;
    noShowCount: number;
    avgRisk: number | null;
    highRiskCount: number;
}

// ─── Student Rank (Advisor only) ────────────────────────────────────────────
export interface StudentRankRow {
    studentId: number;
    studentCode: string | null;
    firstName: string;
    lastName: string;
    gender: string | null;
    facultyName: string;
    departmentName: string;
    totalBookings: number;
    noShowCount: number;
    lateCount: number;
    avgRisk: number | null;
    highRiskCount: number;
    riskScore: number;   // composite sort score
}

// ─── Full API Response ──────────────────────────────────────────────────────
export interface AnalyticsResult {
    summary: SummaryStats;
    previousSummary?: SummaryStats; // [NEW] Summary stats for the equivalent previous period
    loadIndex: LoadIndexItem[];
    problemCategories: ProblemCategoryItem[];
    attendanceByGroup: AttendanceGroupItem[];
    cancellationByGroup: CancellationGroupItem[];
    riskDistribution: RiskDistribution;
    trend: TrendBucket[];
    trendResolution: "hour" | "day" | "week" | "month"; // [NEW] The resolution used for the trend buckets
    therapistResource?: {
        internal: number;
        external: number;
        total: number;
    };
    studentRank?: StudentRankRow[];   // only for ADVISOR
}

// ─── Filter option types (for dropdowns) ────────────────────────────────────
export interface FacultyOption {
    facultyId: number;
    facultyCode: string;
    facultyNameTh: string;
    facultyNameEn: string | null;
}

export interface DepartmentOption {
    departmentId: number;
    departmentCode: string;
    departmentNameTh: string;
    departmentNameEn: string | null;
}

export interface ProblemCategoryOption {
    problemCategoryId: number;
    problemCategoryCode: string;
    problemCategoryNameTh: string;
    problemCategoryNameEn: string | null;
}

// ─── Load Index Weight Config ───────────────────────────────────────────────
export const LOAD_INDEX_WEIGHTS = {
    booking: 1,
    highRisk: 2,
    noShow: 1,
    late: 0.5,
    cancelled: 0.5,
} as const;

export type LoadIndexWeights = typeof LOAD_INDEX_WEIGHTS;
