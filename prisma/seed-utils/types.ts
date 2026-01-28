// prisma/seed-utils/types.ts
import type {
  PrismaClient,
  University,
  Province,
  Region,
  Faculty,
  Department,
  Advisor,
  Organization,
  StudentStatus,
  ProblemCategory,
  EvaluationCriterion,
  NotificationTemplate,
  PointRule,
  Consultant,
  Student,
  TimeSlot,
  BookingStatus,
} from "@prisma/client";

/**
 * ใช้ทำ typing กลางสำหรับ seed pipeline
 * - กัน any หลุด
 * - ทำให้ seed แต่ละไฟล์ส่ง/รับข้อมูลกันถูกต้อง
 */

// =========================
// Seed 00 - Clear
// =========================
export type Seed00_Clear = (prisma: PrismaClient) => Promise<void>;

// =========================
// Seed 01 - Geo
// =========================
export type SeedGeoResult = {
  regions: Region[];
  provinces: Province[];
  universities: University[];
};

// =========================
// Seed 02 - Static
// =========================
export type SeedStaticResult = {
  // auth
  plainPassword: string;
  passwordHash: string;

  statusActive: StudentStatus;
  statusInactive: StudentStatus;

  org: Organization;

  problemCategories: ProblemCategory[];
  criteria: EvaluationCriterion[];

  tplCreated: NotificationTemplate;
  tplAssigned: NotificationTemplate;

  /**
   * points:
   * - pointRule/pointAmount = default rule ที่ seed.ts ส่งต่อให้ seedBookings
   * - pointRules = เผื่อกรณี seed หลาย rule (แนะนำ)
   */
  pointRule: PointRule;
  pointAmount: number;
  pointRules?: PointRule[];
};

// =========================
// Seed 03 - Faculty/Dept
// =========================
export type SeedFacultyResult = {
  facultyByUniAndCode: Map<string, Faculty>; // key = `${university_id}:${faculty_code}`
  deptByUniAndCode: Map<string, Department>; // key = `${university_id}:${department_code}`
};

// =========================
// Seed 04 - Advisors
// =========================
export type SeedAdvisorsResult = Advisor[];

// =========================
// Seed 05 - Accounts (head/rector/super)
// =========================
export type SeedAccountsResult = {
  superAccount: { account_id: number };
  headAccountIdByUniversityId: Map<number, number>; // university_id -> head account_id
};

// =========================
// Seed 06 - Consultants
// =========================
export type SeedConsultantsResult = {
  consultants: Consultant[];
  consultantBiasById: Map<number, number>; // consultant_id -> base mean score
};

// =========================
// Seed 07 - Students
// =========================
export type SeedStudentsResult = Student[];

// =========================
// Seed 08 - TimeSlots
// =========================
export type SeedTimeSlotsResult = {
  timeSlotsByUniId: Map<number, TimeSlot[]>; // ✅ ตรงกับของจริง (findMany คืน TimeSlot[])
  totalTimeSlots: number;
};

// =========================
// Seed 09 - Bookings
// =========================
export type BookingPlanItem = { status: BookingStatus; count: number };

export type SeedBookingsArgs = {
  universities: University[];
  students: Student[];
  consultants: Consultant[];

  timeSlotsByUniId: SeedTimeSlotsResult["timeSlotsByUniId"];

  problemCategories: ProblemCategory[];
  criteria: EvaluationCriterion[];

  headAccountIdByUniversityId: Map<number, number>;

  tplCreated: NotificationTemplate;
  tplAssigned: NotificationTemplate;

  // points
  pointRule: PointRule;
  pointAmount: number;

  consultantBiasById: Map<number, number>;

  bookingPlan: BookingPlanItem[];
};

// =========================
// Utility type (optional)
// =========================
export type IdMap<TKey, TValue> = Map<TKey, TValue>;
