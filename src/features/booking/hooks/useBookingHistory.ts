import { useCallback, useEffect, useRef, useState } from "react";
import type { MyBookingDto, BookingStatus } from "../types";
import { getBookingHistory } from "../api";

export function useBookingHistory(opts?: { universityId?: number, limit?: number }) {
  const [items, setItems] = useState<MyBookingDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(opts?.limit ?? 10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async (targetPage = page) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getBookingHistory({ 
        universityId: opts?.universityId, 
        page: targetPage, 
        limit, 
        signal: ac.signal 
      });
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? "Failed to load booking history");
    } finally {
      setIsLoading(false);
    }
  }, [opts?.universityId, page, limit]);

  useEffect(() => {
    refetch(page);
    return () => abortRef.current?.abort();
  }, [refetch, page]);

  // Listen for global booking changes (e.g. from AI)
  useEffect(() => {
    const handleChanged = () => refetch(page);
    window.addEventListener("booking:changed", handleChanged);
    return () => window.removeEventListener("booking:changed", handleChanged);
  }, [refetch, page]);

  return {
    items,
    total,
    page,
    limit,
    setPage,
    isLoading,
    error,
    refetch,
    totalPages: Math.ceil(total / limit),
  };
}
