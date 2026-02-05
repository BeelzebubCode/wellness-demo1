"use client";

import { useCallback, useEffect, useState } from "react";

export type ProblemCategoryOption = {
  id: number;
  code: string;
  nameTh: string;
};

export function useProblemCategoriesQuery() {
  const [categories, setCategories] = useState<ProblemCategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/problem-categories");
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, isLoading };
}
