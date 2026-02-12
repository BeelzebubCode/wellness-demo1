// src/features/head-consultant/bookings/hook/useAssigneesQuery.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssigneeOption } from "../types";
import { fetchAssignees } from "../api/assignees";

export function useAssigneesQuery(date?: string) {
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchAssignees(date);
      setAssignees(list);
    } catch {
      setAssignees([]);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { assignees, isLoading, refresh };
}
