"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMyProfile } from "../api";
import type { ProfileInclude, ProfileMeDTO } from "../types";

export function useMyProfile(include?: ProfileInclude) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ProfileMeDTO | null>(null);

  // stringify ให้ stable dependency (object ref จะไม่ทำให้ effect loop)
  const includeKey = useMemo(() => JSON.stringify(include ?? {}), [include]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const includeObj = includeKey ? (JSON.parse(includeKey) as ProfileInclude) : undefined;
      const data = await fetchMyProfile(includeObj);
      setMe(data);
    } catch (e: any) {
      setMe(null);
      setError(e?.message ?? "โหลดโปรไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [includeKey]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  return { loading, error, me, refetch: load };
}
