// src/features/dashboard/ministry/hooks/useUniversitiesMap.ts
import { useEffect, useState, useRef } from "react";
import { fetchUniversitiesMap } from "../services/ministry-api";
import type { UniversityMapData } from "../services/ministry-types";

// Re-export type so existing consumers don't break
export type { UniversityMapData } from "../services/ministry-types";

export interface UniversitiesMapFilters {
  dateFrom?: string;
  dateTo?: string;
  serviceModes?: string[];
}

export function useUniversitiesMap(filters?: UniversitiesMapFilters) {
  const [universities, setUniversities] = useState<UniversityMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build a stable key so we only refetch when filter values actually change
  const filterKey = JSON.stringify({
    dateFrom: filters?.dateFrom || "",
    dateTo: filters?.dateTo || "",
    serviceModes: (filters?.serviceModes || []).sort().join(","),
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchUniversitiesMap(500, filters);
        if (!cancelled) setUniversities(data);
      } catch (err) {
        console.error("Error loading universities:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load universities");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { universities, isLoading, error };
}
