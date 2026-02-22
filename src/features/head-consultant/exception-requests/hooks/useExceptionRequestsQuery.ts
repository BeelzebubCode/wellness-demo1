// src/features/head-consultant/exception-requests/hooks/useExceptionRequestsQuery.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchExceptionRequests } from "../api/requests";
import { ExceptionStatus } from "@prisma/client";
import type { ExceptionRequestRow } from "../types";

export function useExceptionRequestsQuery(status: ExceptionStatus | "ALL", page: number = 1) {
  const [rows, setRows] = useState<ExceptionRequestRow[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchExceptionRequests(status, page);
      setRows(res.data || []);
      setMeta(res.meta);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, meta, isLoading, error, refresh };
}
