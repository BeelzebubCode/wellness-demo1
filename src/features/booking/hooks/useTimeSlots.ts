// src/features/booking/hooks/useTimeSlots.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimeSlot } from "../types";
import { getTimeSlots } from "../api";
import { normalizeTimeSlot } from "../utils/normalizeTimeSlot";
import type { TimeSlotCore } from "@/shared/types/timeSlot";

export function useTimeSlots(date: string, universityId?: number) {
  const [rawSlots, setRawSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!date) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const data = await getTimeSlots(date, { universityId, signal: ac.signal });
      setRawSlots(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? "Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [date, universityId]);

  useEffect(() => {
    fetchSlots();
    return () => abortRef.current?.abort();
  }, [fetchSlots]);

  const slots: TimeSlotCore[] = useMemo(() => {
    const now = new Date();
    return rawSlots.map((s) => normalizeTimeSlot(s, now));
  }, [rawSlots]);

  const openSlots = useMemo(() => slots.filter((s) => s.status === "OPEN"), [slots]);

  return { slots, openSlots, loading, error, refetch: fetchSlots };
}
