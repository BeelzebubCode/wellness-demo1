export type BorrowRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
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

  borrowNeededFrom?: string | null; // ISO
  borrowNeededTo?: string | null; // ISO
  borrowNeededCount: number;

  borrowRequestStatus: BorrowRequestStatus;

  borrowSubmittedAt?: string | null;
  borrowApprovedAt?: string | null;
  borrowRejectedAt?: string | null;

  borrowRejectReason?: string | null;

  borrowRequestCreatedAt: string; // ISO
  borrowRequestUpdatedAt: string; // ISO
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
};

export type BorrowRequestDetail = BorrowRequest & {
  assignments: BorrowAssignment[];
};

export type CreateBorrowRequestInput = {
  title: string;
  reason: string;
  detail?: string | null;
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

export type RejectBorrowRequestInput = {
  reason: string;
};
