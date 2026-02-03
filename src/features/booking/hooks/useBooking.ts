import { useState } from "react";
import type { BookingPayload } from "../types";
import { createBooking } from "../api";

export function useBooking(universityId?: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitBooking(payload: BookingPayload) {
    setLoading(true);
    setError(null);

    try {
      const res = await createBooking(payload, { universityId });
      return res; // { success: true, bookingId, universityId }
    } catch (e: any) {
      setError(e?.message ?? "Booking failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { submitBooking, loading, error };
}
