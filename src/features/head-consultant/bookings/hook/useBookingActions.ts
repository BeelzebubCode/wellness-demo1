// src/features/head-consultant/bookings/hook/useBookingActions.ts
"use client";

import { useCallback, useState } from "react";
import { assignBooking, cancelBooking, rescheduleBooking } from "../api/bookings";
import { useToast } from "@/contexts/ToastContext";

export function useBookingActions(opts?: { onDone?: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const doAssign = useCallback(
    async (input: {
      universityId: number;
      bookingId: number;
      consultantId: number; // ✅ required
      borrowAssignmentId?: number;
      note?: string;
    }) => {
      setIsSaving(true);
      setActionError(null);
      try {
        await assignBooking(input);
        success("แจกงานสำเร็จ");
        opts?.onDone?.();
      } catch (e: any) {
        const msg = e?.message ?? "Assign ไม่สำเร็จ";
        setActionError(msg);
        toastError(msg);
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [opts, success, toastError],
  );

  const doReschedule = useCallback(
    async (input: {
      universityId: number;
      bookingId: number;
      newTimeSlotId: number;
      note?: string;
    }) => {
      setIsSaving(true);
      setActionError(null);
      try {
        await rescheduleBooking(input);
        success("เลื่อนเวลาสำเร็จ");
        opts?.onDone?.();
      } catch (e: any) {
        const msg = e?.message ?? "Reschedule ไม่สำเร็จ";
        setActionError(msg);
        toastError(msg);
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [opts, success, toastError],
  );

  const doCancel = useCallback(
    async (input: { universityId: number; bookingId: number; reason: string }) => {
      setIsSaving(true);
      setActionError(null);
      try {
        await cancelBooking(input);
        success("ยกเลิกรายการสำเร็จ");
        opts?.onDone?.();
      } catch (e: any) {
        const msg = e?.message ?? "Cancel ไม่สำเร็จ";
        setActionError(msg);
        toastError(msg);
        throw e;
      } finally {
        setIsSaving(false);
      }
    },
    [opts, success, toastError],
  );

  return { isSaving, error: actionError, doAssign, doReschedule, doCancel };
}
