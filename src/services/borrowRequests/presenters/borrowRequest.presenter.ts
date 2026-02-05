// src/services/borrowRequests/presenters/borrowRequest.presenter.ts

import type { BorrowRequest, BorrowAssignment } from "@prisma/client";

export function presentBorrowRequest(
  br: BorrowRequest & {
    assignments?: (BorrowAssignment & {
      consultant?: any;
      consultantUniversity?: any;
    })[];
    fromUniversity?: any;
    requestedBy?: any;
  }
) {
  return {
    borrowRequestId: br.borrow_request_id,
    borrowRequestTitle: br.borrow_request_title,
    borrowRequestReason: br.borrow_request_reason,
    borrowRequestDetail: br.borrow_request_detail,

    borrowNeededFrom: br.borrow_needed_from?.toISOString() ?? null,
    borrowNeededTo: br.borrow_needed_to?.toISOString() ?? null,
    borrowNeededCount: br.borrow_needed_count,

    borrowRequestStatus: br.borrow_request_status,

    borrowRequestCreatedAt: br.borrow_request_created_at.toISOString(),
    borrowRequestUpdatedAt: br.borrow_request_updated_at.toISOString(),
    borrowSubmittedAt: br.borrow_submitted_at?.toISOString() ?? null,
    borrowApprovedAt: br.borrow_approved_at?.toISOString() ?? null,
    borrowRejectedAt: br.borrow_rejected_at?.toISOString() ?? null,

    borrowRejectReason: br.borrow_reject_reason ?? null,

    // Relations
    fromUniversityId: br.from_university_id,
    fromUniversityCode: br.fromUniversity?.university_code ?? null,
    fromUniversityNameTh: br.fromUniversity?.university_name_th ?? null,

    requestedByAccountId: br.requested_by_account_id,
    requestedByName: br.requestedBy?.account_username ?? null,

    assignments: br.assignments?.map((a) => ({
      borrowAssignmentId: a.borrow_assignment_id,
      borrowRequestId: a.borrow_request_id,
      consultantId: a.consultant_id,
      consultantUniversityId: a.consultant_university_id,
      borrowAssignStartAt: a.borrow_assign_start_at.toISOString(),
      borrowAssignEndAt: a.borrow_assign_end_at.toISOString(),
      borrowAssignedAt: a.borrow_assigned_at.toISOString(),
      borrowAssignmentNote: a.borrow_assignment_note ?? null,

      consultantName: a.consultant?.profile
        ? `${a.consultant.profile.consultant_first_name ?? ""} ${a.consultant.profile.consultant_last_name ?? ""}`.trim() || null
        : null,
      consultantUniversityCode: a.consultantUniversity?.university_code ?? null,
    })) ?? [],
  };
}