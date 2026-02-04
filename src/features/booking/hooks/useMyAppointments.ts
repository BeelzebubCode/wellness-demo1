// src/features/booking/hooks/useMyAppointments.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { MyBookingDto, BookingStatus } from "../types";
import { getMyAppointments } from "../api";

const ACTIVE_STATUSES: BookingStatus[] = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"];
const PAST_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED"];

export function useMyAppointments(universityId?: number) {
  const [items, setItems] = useState<MyBookingDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getMyAppointments({ universityId, signal: ac.signal });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  const activeBooking = items.find((b) => ACTIVE_STATUSES.includes(b.status)) ?? null;
  const pastBookings = items.filter((b) => PAST_STATUSES.includes(b.status));

  return {
    items,
    activeBooking,
    pastBookings,

    // ✅ ชื่อใหม่
    isLoading,
    // ✅ compat ชื่อเดิมที่หน้าเรียก
    loading: isLoading,

    error,
    refetch,
  };
}
