// src/features/dashboard/ministry/hooks/useRiskMetrics.ts
"use client";

import { useState, useEffect } from "react";
import { fetchRiskMetrics } from "../services/ministry-api";
import type { RiskMetricsResponse, RiskMetricsFilters } from "../services/ministry-types";

// Re-export types so existing consumers don't break
export type { UniversityRiskMetrics, RegionalRiskMetrics } from "../services/ministry-types";

export function useRiskMetrics(filters?: RiskMetricsFilters) {
  const [data, setData] = useState<RiskMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const result = await fetchRiskMetrics(filters);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filters?.region, filters?.type, filters?.days]);

  return { data, isLoading, error };
}
