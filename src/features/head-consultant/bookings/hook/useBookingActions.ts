// src/features/head-consultant/bookings/hook/useBookingActions.ts
"use client";

import { useCallback, useState } from "react";
import { assignBooking, cancelBooking, rescheduleBooking } from "../api/bookings";

export function useBookingActions(opts?: { onDone?: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doAssign = useCallback(
    async (input: {
      universityId: number;
      bookingId: number;
      consultantId: number; // ✅ required
      note?: string;
    }) => {
      setIsSaving(true);
      setError(null);
      try {
        await assignBooking(input);
        opts?.onDone?.();
      } catch (e: any) {
        setError(e?.message ?? "Assign ไม่สำเร็จ");
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [opts],
  );

  const doReschedule = useCallback(
    async (input: {
      universityId: number;
      bookingId: number;
      newTimeSlotId: number;
      note?: string;
    }) => {
      setIsSaving(true);
      setError(null);
      try {
        await rescheduleBooking(input);
        opts?.onDone?.();
      } catch (e: any) {
        setError(e?.message ?? "Reschedule ไม่สำเร็จ");
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [opts],
  );

  const doCancel = useCallback(
    async (input: { universityId: number; bookingId: number; reason: string }) => {
      setIsSaving(true);
      setError(null);
      try {
        await cancelBooking(input);
        opts?.onDone?.();
      } catch (e: any) {
        setError(e?.message ?? "Cancel ไม่สำเร็จ");
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [opts],
  );

  return { isSaving, error, doAssign, doReschedule, doCancel };
}
