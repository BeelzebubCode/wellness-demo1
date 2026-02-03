import { useEffect, useRef, useState } from "react";
import type { MyAppointment } from "../types";
import { getMyAppointments } from "../api";

export function useMyAppointments(universityId?: number) {
  const [items, setItems] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    getMyAppointments({ universityId, signal: ac.signal })
      .then(setItems)
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to load appointments");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [universityId]);

  return { items, loading, error };
}
