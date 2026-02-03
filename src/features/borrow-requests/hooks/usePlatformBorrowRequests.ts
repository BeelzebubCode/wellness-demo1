// src/features/borrow-requests/hooks/usePlatformBorrowRequests.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { platformBorrowRequestsApi } from "../api";
import type { BorrowRequest, PlatformListParams } from "../types";

type ApiBorrowRequest = {
  borrow_request_id: number;
  borrow_request_title: string;
  borrow_request_reason: string;
  borrow_request_status: string;
  borrow_needed_count: number;
};

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

      const items: BorrowRequest[] = res.data;

      const mapped: BorrowRequest[] = items.map((r) => ({
        borrowRequestId: r.borrowRequestId,
        borrowRequestTitle: r.borrowRequestTitle,
        borrowRequestReason: r.borrowRequestReason,
        borrowRequestStatus: r.borrowRequestStatus,
        borrowNeededCount: r.borrowNeededCount,
      }));

      setRows(mapped);

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
