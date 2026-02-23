// src/features/dashboard/ministry/hooks/useUniversitiesMap.ts
import { useEffect, useState } from "react";
import { fetchUniversitiesMap } from "../services/ministry-api";
import type { UniversityMapData } from "../services/ministry-types";

// Re-export type so existing consumers don't break
export type { UniversityMapData } from "../services/ministry-types";

export function useUniversitiesMap() {
  const [universities, setUniversities] = useState<UniversityMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchUniversitiesMap();
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
  }, []);

  return { universities, isLoading, error };
}
