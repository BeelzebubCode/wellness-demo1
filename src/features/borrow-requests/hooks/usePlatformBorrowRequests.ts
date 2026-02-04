// src/features/borrow-requests/hooks/usePlatformBorrowRequests.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { platformBorrowRequestsApi } from "../api";
import type { BorrowRequest, PlatformListParams } from "../types";

export function usePlatformBorrowRequests(params?: PlatformListParams) {
  const [rows, setRows] = useState<BorrowRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = useMemo(() => JSON.stringify(params || {}), [params]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Hook: Fetching with params:', params);
      
      const response = await platformBorrowRequestsApi.list(params || {});
      
      console.log('📦 Hook: Raw response:', response);
      console.log('📦 Hook: response.ok:', response?.ok);
      console.log('📦 Hook: response.data:', response?.data);

      if (response.ok && response.data) {
        const { items, total, page, pageSize } = response.data;
        
        console.log('✅ Hook: Extracted data:', { 
          itemsLength: items?.length, 
          total, 
          page, 
          pageSize 
        });
        
        setRows(items || []);
        setTotal(total || 0);
        setPage(page || 1);
        setPageSize(pageSize || 20);
      } else {
        console.warn('⚠️ Hook: Unexpected response format');
        setRows([]);
        setTotal(0);
      }
    } catch (e: any) {
      console.error('❌ Hook: Error:', e);
      setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { 
    rows, 
    total, 
    page, 
    pageSize, 
    loading, 
    error, 
    refetch 
  };
}