import { useEffect, useMemo, useRef, useState } from "react";
import type { TimeSlot } from "../types";
import { getTimeSlots } from "../api";

export function useTimeSlots(date: string, universityId?: number) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!date) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    getTimeSlots(date, { universityId, signal: ac.signal })
      .then(setSlots)
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to load slots");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [date, universityId]);

  const openSlots = useMemo(
    () => slots.filter((s) => s.time_slot_status === "OPEN"),
    [slots],
  );

  return { slots, openSlots, loading, error, refetch: () => {} };
}
