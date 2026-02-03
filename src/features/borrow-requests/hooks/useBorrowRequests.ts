//src\features\borrow-requests\hooks\useBorrowRequests.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { borrowRequestsApi } from "../api";
import type { BorrowRequest, CreateBorrowRequestInput } from "../types";

export function useBorrowRequests() {
  const [rows, setRows] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await borrowRequestsApi.listMy();
      setRows(res.data || []);
    } catch (e: any) {
      setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (input: CreateBorrowRequestInput) => {
      setError(null);
      const res = await borrowRequestsApi.create(input);
      await refetch();
      return res.data;
    },
    [refetch],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rows, loading, error, refetch, create };
}
