// src/features/consultant/shifts/hooks/useMySchedule.ts

"use client";

import { useState, useEffect } from "react";
import { getMySchedule } from "../api/getMySchedule";
import type { MyScheduleResponse } from "../types";

export function useMySchedule() {
  const [data, setData] = useState<MyScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        const result = await getMySchedule();
        
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
}
