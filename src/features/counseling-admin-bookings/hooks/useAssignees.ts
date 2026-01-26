// features/counseling-admin-bookings/hooks/useAssignees.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssigneeOption } from "../type";
import { fetchAssigneesV2 } from "../api";

export function useAssignees() {
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchAssigneesV2();
      setAssignees(list);
    } catch {
      setAssignees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { assignees, isLoading, refresh };
}
