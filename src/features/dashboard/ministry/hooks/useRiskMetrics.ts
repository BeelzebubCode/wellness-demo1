// src/features/dashboard/ministry/hooks/useRiskMetrics.ts
"use client";

import { useState, useEffect } from "react";

export interface UniversityRiskMetrics {
  universityId: number;
  universityCode: string;
  universityName: string;
  universityType: string;
  province: string;
  regionCode: string;
  regionName: string;
  queueSize: number;
  avgWaitTime: number;
  highRiskPercentage: number;
  therapistUtilization: number;
  riskScore: number;
}

export interface RegionalRiskMetrics {
  regionCode: string;
  regionName: string;
  totalUniversities: number;
  avgRiskScore: number;
  totalQueue: number;
  avgWaitTime: number;
  highRiskPercentage: number;
  status: "normal" | "warning" | "critical";
}

interface RiskMetricsResponse {
  universities: UniversityRiskMetrics[];
  regions: RegionalRiskMetrics[];
  metadata: {
    totalUniversities: number;
    dateRange: {
      start: string;
      end: string;
    };
    filters: {
      region?: string;
      type?: string;
      days: number;
    };
  };
}

export function useRiskMetrics(filters?: {
  region?: string;
  type?: string;
  days?: number;
}) {
  const [data, setData] = useState<RiskMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filters?.region) params.set("region", filters.region);
        if (filters?.type) params.set("type", filters.type);
        if (filters?.days) params.set("days", filters.days.toString());

        const res = await fetch(`/api/v2/dashboards/ministry?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch risk metrics");

        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, [filters?.region, filters?.type, filters?.days]);

  return { data, isLoading, error };
}
