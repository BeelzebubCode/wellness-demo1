// src/features/booking/hooks/useMyAppointments.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { MyBookingDto, BookingStatus } from "../types";
import { getMyAppointments, getMyAppointmentsFull } from "../api";

const ACTIVE_STATUSES: BookingStatus[] = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"];
const PAST_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED"];

export function useMyAppointments(opts?: { universityId?: number; statusGroup?: "ALL" | "ACTIVE" | "HISTORY"; limit?: number }) {
  const { universityId, statusGroup = "ALL", limit = 50 } = opts ?? {};
  const [items, setItems] = useState<MyBookingDto[]>([]);
  const [total, setTotal] = useState(0); // ✅ Total from server
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
      const resp = await getMyAppointmentsFull({ universityId, statusGroup, limit, signal: ac.signal });
      if (resp.success === true) {
        setItems(Array.isArray(resp.items) ? resp.items : []);
        setTotal(resp.total ?? 0);
      } else {
        setError(resp.error || "Failed to load appointments");
      }
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

  // ✅ Auto-refresh on AI changes
  useEffect(() => {
    const handleChanged = () => refetch();
    window.addEventListener("booking:changed", handleChanged);
    return () => window.removeEventListener("booking:changed", handleChanged);
  }, [refetch]);

  const activeBooking = items.find((b) => ACTIVE_STATUSES.includes(b.status)) ?? null;
  const pastBookings = items.filter((b) => PAST_STATUSES.includes(b.status));

  return {
    items,
    total, // ✅ Return total
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
