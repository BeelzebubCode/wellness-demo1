// src/features/booking/hooks/useMyExceptionRequests.ts
import { useCallback, useEffect, useState } from "react";

export interface ExceptionRequestItem {
    booking_exception_request_id: number;
    university_id: number;
    booking_id: number;
    student_id: number;
    booking_exception_reason_code: string;
    booking_exception_reason_detail: string;
    booking_exception_status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
    booking_exception_decision_note: string | null;
    booking_exception_requested_at: string;
    booking_exception_submitted_at: string | null;
    booking_exception_reviewed_at: string | null;
    booking_exception_deadline_at: string | null;
    booking: {
        booking_id: number;
        booking_status: string;
        booking_created_at: string;
        problemCategory?: { problem_category_name_th: string; problem_category_name_en: string } | null;
        cancellation?: {
            booking_cancellation_cancelled_at: string;
            cancellationReason?: { cancellation_reason_name_en: string } | null;
        } | null;
        timeSlot?: { time_slot_start_datetime: string; time_slot_end_datetime: string } | null;
    };
    evidences: { booking_exception_evidence_id: number; booking_exception_evidence_url: string }[];
    exceptionReason?: {
        exception_reason_id: number;
        exception_reason_code: string;
        exception_reason_name_th: string;
    } | null;
}

export interface PenaltyBooking {
    booking_id: number;
    booking_created_at: string;
    problemCategory?: { problem_category_name_th: string } | null;
    cancellation?: {
        booking_cancellation_cancelled_at: string;
        cancellationReason?: { cancellation_reason_name_en: string; cancellation_reason_name_th: string } | null;
    } | null;
    timeSlot?: { time_slot_start_datetime: string; time_slot_end_datetime: string } | null;
    attendance?: { booking_attendance_status: string } | null;
    exceptionRequest?: { booking_exception_request_id: number; booking_exception_status: string } | null;
    deadlineAt: string;
    isExpired: boolean;
    canSubmit: boolean;
    penaltyType: "LATE_CANCEL" | "VERY_LATE_CANCEL";
}

export interface TrustStatusInfo {
    lateCancelCount: number;
    noShowCount: number;
    lockedUntil: string | null;
}

export function useMyExceptionRequests() {
    const [items, setItems] = useState<ExceptionRequestItem[]>([]);
    const [penaltyBookings, setPenaltyBookings] = useState<PenaltyBooking[]>([]);
    const [trustStatus, setTrustStatus] = useState<TrustStatusInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/v2/my/exception-requests");
            const json = await res.json();
            if (json.success) {
                setItems(json.data ?? []);
                setPenaltyBookings(json.penaltyBookings ?? []);
                setTrustStatus(json.trustStatus ?? null);
            } else {
                setError(json.error ?? "Failed to load");
            }
        } catch (e: any) {
            setError(e?.message ?? "Network error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { items, penaltyBookings, trustStatus, isLoading, error, refetch };
}
