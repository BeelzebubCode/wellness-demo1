"use client";

import { useCallback, useEffect, useState } from "react";
import { aiKbApi } from "../api";
import type { AiKbDoc } from "../types";

type ScopeFilter = "ALL" | "GLOBAL" | "TENANT";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

type UseAiKbDocumentsArgs = {
  q?: string;
  scope?: ScopeFilter;
  active?: ActiveFilter;
  universityId?: number | null | undefined; // undefined=ALL, null=GLOBAL, number=TENANT
};

export function useAiKbDocuments(args: UseAiKbDocumentsArgs = {}) {
  const { q = "", scope = "ALL", active = "ALL", universityId } = args;

  const [docs, setDocs] = useState<AiKbDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const r: any = await aiKbApi.listDocuments({ q, scope, active, universityId });

      // ✅ รองรับทั้ง {docs,total} และ {data,total}
      const list = Array.isArray(r?.docs) ? r.docs : Array.isArray(r?.data) ? r.data : [];
      const count = Number.isFinite(r?.total) ? r.total : list.length;

      setDocs(list);
      setTotal(count);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [q, scope, active, universityId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { docs, total, isLoading, error, refetch, setDocs };
}
