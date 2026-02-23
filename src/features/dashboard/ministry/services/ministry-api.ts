// src/features/dashboard/ministry/services/ministry-api.ts
// Centralized API service for the Ministry dashboard feature
// All client-side fetch calls are consolidated here.

import type { RiskMetricsFilters, RiskMetricsResponse, UniversityMapData } from "./ministry-types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function safeFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

// ─── Risk Metrics (HeatMap Dashboard) ────────────────────────────────────────

export async function fetchRiskMetrics(filters?: RiskMetricsFilters): Promise<RiskMetricsResponse> {
  const params = new URLSearchParams();
  if (filters?.region) params.set("region", filters.region);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.days) params.set("days", filters.days.toString());

  return safeFetch<RiskMetricsResponse>(`/api/v2/dashboards/ministry?${params.toString()}`);
}

// ─── University Map Data ─────────────────────────────────────────────────────

export async function fetchUniversitiesMap(pageSize = 500): Promise<UniversityMapData[]> {
  const res = await fetch(`/api/v2/master/universities?pageSize=${pageSize}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch universities");

  const result = await res.json();
  if (!result.success) throw new Error(result.error || "Unknown error");

  return result.data as UniversityMapData[];
}
