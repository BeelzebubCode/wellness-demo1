"use client";

import { useEffect, useState } from "react";
import { aiKbApi } from "../api";

export type UniOption = {
  id: number;
  label: string;
  isActive: boolean;
};

export function useUniversities() {
  const [items, setItems] = useState<UniOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await aiKbApi.listUniversities();
        if (!alive) return;
        setItems(
          (r.universities ?? []).map((u) => ({
            id: u.id,
            isActive: u.isActive,
            label: `${u.code} • ${u.nameTh}${u.isActive ? "" : " (ปิดใช้งาน)"}`,
          })),
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { items, loading };
}
