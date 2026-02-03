//src\features\borrow-requests\hooks\useBorrowRequest.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { borrowRequestsApi } from "../api";
import type { BorrowRequest, BorrowRequestDetail, UpdateBorrowRequestInput } from "../types";

export function useBorrowRequest(id: number | null) {
  const [data, setData] = useState<BorrowRequestDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await borrowRequestsApi.get(id);
      setData(res.data);
    } catch (e: any) {
      setError(e?.message || "โหลดรายละเอียดไม่สำเร็จ");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const update = useCallback(
    async (input: UpdateBorrowRequestInput): Promise<BorrowRequest | null> => {
      if (!id) return null;
      setError(null);
      const res = await borrowRequestsApi.update(id, input);
      await refetch();
      return res.data;
    },
    [id, refetch],
  );

  const submit = useCallback(async () => {
    if (!id) return;
    setError(null);
    await borrowRequestsApi.submit(id);
    await refetch();
  }, [id, refetch]);

  const cancel = useCallback(async () => {
    if (!id) return;
    setError(null);
    await borrowRequestsApi.cancel(id);
    await refetch();
  }, [id, refetch]);

  useEffect(() => {
    if (id) refetch();
  }, [id, refetch]);

  return { data, loading, error, refetch, update, submit, cancel };
}
