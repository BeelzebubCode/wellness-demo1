// src/features/head-consultant/exception-requests/types.ts
import { ExceptionStatus } from "@prisma/client";

export type ExceptionRequestRow = {
  booking_exception_request_id: number;
  booking_exception_reason_code: string;
  booking_exception_status: ExceptionStatus;
  booking_exception_requested_at: string;
  student: {
    profile: {
      student_first_name_th: string | null;
      student_last_name_th: string | null;
      student_prefix: string | null;
    } | null;
  };
  booking: {
    booking_id: number;
    booking_status: string;
    timeSlot: {
      time_slot_start_datetime: string;
      time_slot_end_datetime: string;
    } | null;
  };
  evidences: { booking_exception_evidence_id: number }[];
};

export type ExceptionRequestDetail = {
  booking_exception_request_id: number;
  university_id: number;
  booking_id: number;
  student_id: number;
  booking_exception_reason_code: string;
  booking_exception_reason_detail: string;
  booking_exception_status: ExceptionStatus;
  booking_exception_deadline_at: string | null;
  booking_exception_requested_at: string;
  booking_exception_submitted_at: string | null;
  booking_exception_reviewed_by_id: number | null;
  booking_exception_reviewed_at: string | null;
  booking_exception_decision_note: string | null;

  evidences: Array<{
    booking_exception_evidence_id: number;
    booking_exception_evidence_url: string;
    booking_exception_evidence_name: string | null;
    booking_exception_evidence_type: string | null;
    booking_exception_evidence_size: number | null;
    booking_exception_evidence_uploaded_at: string;
  }>;

  student: {
    profile: {
      student_first_name_th: string | null;
      student_last_name_th: string | null;
      student_prefix: string | null;
    } | null;
    behaviorStatus: {
      student_trust_late_cancel_count: number;
      student_trust_no_show_count: number;
      student_trust_locked_until: string | null;
    } | null;
  };

  booking: {
    timeSlot: {
      time_slot_start_datetime: string;
      time_slot_end_datetime: string;
    } | null;
    attendance: {
      booking_attendance_status: string;
      booking_attendance_note: string | null;
    } | null;
    cancellation: {
      booking_cancellation_cancelled_at: string;
      booking_cancellation_note: string | null;
      cancellationReason: {
        cancellation_reason_name: string;
      } | null;
    } | null;
    problemCategory: {
      problem_category_name: string;
    } | null;
  };

  reviewedBy: {
    account_id: number;
    account_username: string;
  } | null;
};
