// src/features/borrow-requests/types.ts

export type BorrowRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

export type BorrowRequest = {
  borrowRequestId: number;

  fromUniversityId: number;
  fromUniversityCode?: string | null;
  fromUniversityNameTh?: string | null;

  requestedByAccountId: number;
  requestedByName?: string | null;

  borrowRequestTitle: string;
  borrowRequestReason: string;
  borrowRequestDetail?: string | null;

  borrowNeededFrom?: string | null;
  borrowNeededTo?: string | null;
  borrowNeededCount: number;

  borrowRequestStatus: BorrowRequestStatus;

  borrowSubmittedAt?: string | null;
  borrowApprovedAt?: string | null;

  borrowRequestCreatedAt: string;
  borrowRequestUpdatedAt: string;
};

export type BorrowAssignment = {
  borrowAssignmentId: number;
  borrowRequestId: number;

  consultantId: number;
  consultantUniversityId: number;
  consultantName?: string | null;
  consultantUniversityCode?: string | null;

  borrowAssignStartAt: string; // ISO
  borrowAssignEndAt: string; // ISO

  borrowAssignedByAccountId: number;
  borrowAssignedAt: string; // ISO
  borrowAssignmentNote?: string | null;

  consultantUniversity?: {
    id: number;
    code: string | null;
    nameTh: string | null;
    nameEn?: string | null;
  };
};

// ------------------------------
// ✅ NEW: ranking & parsed detail
// ------------------------------
export type BorrowRequestDetailJson = {
  serviceMode?: "ONLINE" | "ONSITE";
  requiredTopics?: string[];
  onlineChannel?: string | null;
  onsiteLocationText?: string | null;
  notes?: string | null;
};

export type RankedConsultant = {
  consultantId: number;
  consultantUniversityId: number;
  consultantName: string;
  matchedTopics: string[];
  shifts: Array<{
    borrowOnCallShiftId: number;
    startAt: string; // ISO
    endAt: string; // ISO
    status: string;
  }>;
};

export type RankedUniversity = {
  universityId: number;
  universityCode: string;
  universityNameTh: string;
  distanceKm: number | null;
  matchScore: number;
  reasons: string[];
  availableConsultants: RankedConsultant[];
};

// ✅ Detail เดิม + เพิ่ม field ใหม่แบบ optional
export type BorrowRequestDetail = BorrowRequest & {
  assignments: BorrowAssignment[];

  // ✅ เพิ่มแบบ user-friendly (optional เพื่อไม่พังหน้าอื่น)
  fromUniversity?: {
    id: number;
    code: string | null;
    nameTh: string | null;
    nameEn?: string | null;
  };

  requestedBy?: {
    accountId: number;
    username: string | null;
    role?: string | null;
  };

  // ✅ platform detail จะมี 2 field นี้เพิ่มมา (my-detail อาจไม่มี)
  parsedDetail?: BorrowRequestDetailJson;
  rankedUniversities?: RankedUniversity[];
};

// ✅ ใช้ใน UI form เท่านั้น
export type BorrowRequestFormInput = {
  title: string;
  reason: string;
  detail?: string | null;
  neededFrom?: string | null; // ISO
  neededTo?: string | null; // ISO
  neededCount: number;
};

// ✅ API payload ตรงกับ table borrow_request
export type CreateBorrowRequestInput = {
  title: string;
  reason: string;
  detail?: string | null; // อาจเป็น JSON string ก็ได้
  neededFrom?: string | null; // ISO
  neededTo?: string | null; // ISO
  neededCount?: number;
};

export type UpdateBorrowRequestInput = Partial<CreateBorrowRequestInput> & {
  status?: "CANCELLED" | "DRAFT";
};

export type PlatformListParams = {
  q?: string;
  status?: BorrowRequestStatus | "ALL";
  fromUniversityId?: number | null;
  dateFrom?: string | null; // ISO YYYY-MM-DD
  dateTo?: string | null; // ISO YYYY-MM-DD
};

export type AssignBorrowRequestInput = {
  items: Array<{
    consultantId: number;
    consultantUniversityId: number;
    startAt: string; // ISO
    endAt: string; // ISO
    note?: string | null;
  }>;
};

// ✅ เพิ่ม type สำหรับ pagination response
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type BorrowRequestListResponse = PaginatedResponse<BorrowRequest>;

