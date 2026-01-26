"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { platformBorrowRequestsApi } from "../api";
import type { BorrowRequest, PlatformListParams } from "../types";

export function usePlatformBorrowRequests(params?: PlatformListParams) {
  const [rows, setRows] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = useMemo(() => JSON.stringify(params || {}), [params]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await platformBorrowRequestsApi.list(params || {});
      setRows(res.data || []);
    } catch (e: any) {
      setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rows, loading, error, refetch };
}
