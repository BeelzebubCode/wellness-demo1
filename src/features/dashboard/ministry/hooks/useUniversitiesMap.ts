// src/features/dashboard/ministry/hooks/useUniversitiesMap.ts
import { useEffect, useState } from "react";

export interface UniversityMapData {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  lat: number;
  lng: number;
  region: string;
  regionCode: string;
  province: string;
  students: number;
  type: string;
  logo: string;
  dominantProblem?: string | null;
  dominantProblemCode?: string | null;
  dominantProblemTH?: string | null;
  dominantProblemCount: number;
  problemBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>; // 🔥 Added status breakdown
  granularStats: Record<string, Record<string, number>>; // 🔥 Added 2D breakdown
}

export function useUniversitiesMap() {
  const [universities, setUniversities] = useState<UniversityMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUniversities() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/v2/master/universities?pageSize=500");
        
        if (!response.ok) {
          throw new Error("Failed to fetch universities");
        }

        const result = await response.json();
        
        if (result.success) {
          setUniversities(result.data);
        } else {
          throw new Error(result.error || "Unknown error");
        }
      } catch (err) {
        console.error("Error loading universities:", err);
        setError(err instanceof Error ? err.message : "Failed to load universities");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUniversities();
  }, []);

  return {
    universities,
    isLoading,
    error,
  };
}
