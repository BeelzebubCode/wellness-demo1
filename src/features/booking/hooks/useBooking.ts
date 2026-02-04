// src/features/booking/hooks/useBooking.ts
import { useState } from "react";
import type { BookingPayload, CancelBookingInput } from "../types";
import { createBooking, cancelBooking as cancelBookingApi } from "../api";

export function useBooking(universityId?: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function submitBooking(payload: BookingPayload) {
    setLoading(true);
    setError(null);
    try {
      return await createBooking(payload, { universityId });
    } catch (e: any) {
      setError(e?.message ?? "Booking failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  // ✅ overload: รับได้ทั้ง object และ positional
  async function cancelBooking(input: CancelBookingInput): Promise<any>;
  async function cancelBooking(
    bookingId: number | string,
    reason: string,
    uniId?: number,
  ): Promise<any>;
  async function cancelBooking(
    a: CancelBookingInput | number | string,
    b?: string,
    c?: number,
  ) {
    setIsCancelling(true);
    setCancelError(null);

    const normalized: CancelBookingInput =
      typeof a === "object"
        ? a
        : {
            bookingId: Number(a),
            universityId: c ?? universityId ?? 0,
            reason: String(b ?? ""),
          };

    if (!normalized.universityId) {
      const msg = "universityId is required to cancel booking";
      setCancelError(msg);
      setIsCancelling(false);
      throw new Error(msg);
    }

    if (!normalized.reason.trim()) {
      const msg = "กรุณากรอกเหตุผลในการยกเลิก";
      setCancelError(msg);
      setIsCancelling(false);
      throw new Error(msg);
    }

    try {
      return await cancelBookingApi(
        normalized,
        { universityId: normalized.universityId },
      );
    } catch (e: any) {
      setCancelError(e?.message ?? "Cancel booking failed");
      throw e;
    } finally {
      setIsCancelling(false);
    }
  }

  return {
    submitBooking,
    cancelBooking,

    loading,
    isSubmitting: loading,
    error,

    isCancelling,
    cancelError,
  };
}
