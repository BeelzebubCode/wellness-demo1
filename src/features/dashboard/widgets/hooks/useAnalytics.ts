// src/features/dashboard/shared/useAnalytics.ts
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { AnalyticsParams, AnalyticsResult } from "../types/analytics-types";
import { fetchAnalytics } from "../api/analytics-api";

function getDefaultDateRange(): { date_start: string; date_end: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return {
        date_start: `${y}-${String(m).padStart(2, "0")}-01`,
        date_end: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
}

export function useAnalytics(initialOverrides?: Partial<AnalyticsParams>) {
    const defaults = getDefaultDateRange();

    const [params, setParams] = useState<AnalyticsParams>({
        date_start: defaults.date_start,
        date_end: defaults.date_end,
        all_time: false,
        ...initialOverrides,
    });

    const [data, setData] = useState<AnalyticsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce ref
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const paramsKey = useMemo(() => JSON.stringify(params), [params]);

    const doFetch = useCallback(async (p: AnalyticsParams) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchAnalytics(p);
            setData(result);
        } catch (e: any) {
            setError(e?.message ?? "เกิดข้อผิดพลาด");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced fetch on params change
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            doFetch(params);
        }, 300);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [paramsKey, doFetch, params]);

    const updateParams = useCallback((patch: Partial<AnalyticsParams>) => {
        setParams((prev) => ({ ...prev, ...patch }));
    }, []);

    const refresh = useCallback(() => {
        doFetch(params);
    }, [doFetch, params]);

    return { data, loading, error, params, setParams: updateParams, refresh };
}
