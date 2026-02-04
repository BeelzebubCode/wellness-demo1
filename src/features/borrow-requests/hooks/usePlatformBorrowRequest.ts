// src/features/borrow-requests/hooks/usePlatformBorrowRequest.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { platformBorrowRequestsApi } from "../api";
import type {
  AssignBorrowRequestInput,
  BorrowRequest,
  BorrowRequestDetail,
  RejectBorrowRequestInput,
} from "../types";

export function usePlatformBorrowRequest(id: number | null) {
  const [data, setData] = useState<BorrowRequestDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await platformBorrowRequestsApi.get(id);
      setData(res.data);
    } catch (e: any) {
      setError(e?.message || "โหลดรายละเอียดไม่สำเร็จ");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const approve = useCallback(async (): Promise<BorrowRequest | null> => {
    if (!id) return null;
    setError(null);
    const res = await platformBorrowRequestsApi.approve(id);
    await refetch();
    return res.data;
  }, [id, refetch]);

  const reject = useCallback(
    async (input: RejectBorrowRequestInput): Promise<BorrowRequest | null> => {
      if (!id) return null;
      setError(null);
      const res = await platformBorrowRequestsApi.reject(id, input);
      await refetch();
      return res.data;
    },
    [id, refetch]
  );

  const assign = useCallback(
    async (input: AssignBorrowRequestInput): Promise<BorrowRequestDetail | null> => {
      if (!id) return null;
      setError(null);
      const res = await platformBorrowRequestsApi.assign(id, input);
      await refetch();
      return res.data;
    },
    [id, refetch]
  );

  useEffect(() => {
    if (id) refetch();
  }, [id, refetch]);

  return { data, loading, error, refetch, approve, reject, assign };
}
