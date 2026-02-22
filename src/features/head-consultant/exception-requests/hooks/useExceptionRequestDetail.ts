// src/features/head-consultant/exception-requests/hooks/useExceptionRequestDetail.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchExceptionRequestDetail } from "../api/requests";
import type { ExceptionRequestDetail } from "../types";

export function useExceptionRequestDetail(id: number) {
  const [data, setData] = useState<ExceptionRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id || isNaN(id)) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchExceptionRequestDetail(id);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
