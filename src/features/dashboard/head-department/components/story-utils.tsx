// src/features/dashboard/head-department/components/story-utils.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared types, hooks, and UI components used by all story cards
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
export type DatePreset = "month" | "3m" | "6m" | "year" | "all" | "custom";
export type UnitMode = "count" | "percent";

/** Custom date range — only used when preset = "custom" */
export interface DateRange {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
}

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: "month", label: "เดือนนี้" },
    { value: "3m", label: "3 เดือน" },
    { value: "6m", label: "6 เดือน" },
    { value: "year", label: "ปีนี้" },
    { value: "all", label: "ทั้งหมด" },
    { value: "custom", label: "กำหนดเอง" },
];

// ─── Colors ─────────────────────────────────────────────────────────────────
export const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

// ─── Label Maps ─────────────────────────────────────────────────────────────
export const INCOME_LABEL: Record<string, string> = {
    UNDER_100K: "< 100K", BETWEEN_100K_200K: "100-200K", BETWEEN_200K_300K: "200-300K",
    BETWEEN_300K_500K: "300-500K", BETWEEN_500K_800K: "500-800K", BETWEEN_800K_1M: "800K-1M",
    OVER_1M: "> 1M", UNKNOWN: "ไม่ระบุ",
};

export const BIRTH_LABEL: Record<string, string> = {
    ONLY_CHILD: "คนเดียว", FIRST: "คนที่ 1", SECOND: "คนที่ 2",
    THIRD: "คนที่ 3", FOURTH_PLUS: "คนที่ 4+", UNKNOWN: "ไม่ระบุ",
};

export const MONTH_LABEL: Record<string, string> = {
    "01": "ม.ค.", "02": "ก.พ.", "03": "มี.ค.", "04": "เม.ย.",
    "05": "พ.ค.", "06": "มิ.ย.", "07": "ก.ค.", "08": "ส.ค.",
    "09": "ก.ย.", "10": "ต.ค.", "11": "พ.ย.", "12": "ธ.ค.",
};

export const RISK_META: Record<string, { label: string; color: string; bg: string }> = {
    VERY_HIGH: { label: "สูงมาก", color: "#dc2626", bg: "bg-red-50" },
    HIGH: { label: "สูง", color: "#f43f5e", bg: "bg-rose-50" },
    MEDIUM: { label: "ปานกลาง", color: "#f59e0b", bg: "bg-amber-50" },
    LOW: { label: "ต่ำ", color: "#22c55e", bg: "bg-green-50" },
    VERY_LOW: { label: "ต่ำมาก", color: "#10b981", bg: "bg-emerald-50" },
    UNKNOWN: { label: "ไม่ระบุ", color: "#94a3b8", bg: "bg-slate-50" },
};

// ─── Date Range Helper ──────────────────────────────────────────────────────
export function getDateRange(
    preset: DatePreset,
    customRange?: DateRange,
): { start?: string; end?: string; allTime: boolean } {
    if (preset === "all") return { allTime: true };
    if (preset === "custom" && customRange) {
        return { start: customRange.start, end: customRange.end, allTime: false };
    }
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    let start: Date;
    switch (preset) {
        case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "3m": start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
        case "year": start = new Date(now.getFullYear(), 0, 1); break;
        default: start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { start: start.toISOString().split("T")[0], end, allTime: false };
}

// ─── Shared Hook: story data fetching ───────────────────────────────────────
export function useStoryData<T>(
    story: string,
    filters: Record<string, string[]>,
    datePreset: DatePreset,
    customRange?: DateRange,
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [dept, setDept] = useState<any>(null);

    const fetchKey = JSON.stringify({ story, filters, datePreset, customRange });

    useEffect(() => {
        let cancelled = false;

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const parsed = JSON.parse(fetchKey) as {
                    story: string; filters: Record<string, string[]>;
                    datePreset: DatePreset; customRange?: DateRange;
                };
                const sp = new URLSearchParams();
                sp.set("story", parsed.story);
                const dr = getDateRange(parsed.datePreset, parsed.customRange);
                if (dr.allTime) sp.set("all_time", "true");
                else {
                    if (dr.start) sp.set("date_start", dr.start);
                    if (dr.end) sp.set("date_end", dr.end);
                }
                Object.entries(parsed.filters).forEach(([k, v]) => {
                    if (v.length) sp.set(k, v.join(","));
                });
                const res = await fetch(`/api/v2/dashboards/head-department?${sp}`, {
                    credentials: "include", cache: "no-store",
                });
                if (cancelled) return;
                const json = await res.json();
                if (cancelled) return;
                if (!res.ok) throw new Error(json?.error);
                setData(json.data?.[parsed.story] ?? null);
                if (json.data?.department) setDept(json.data.department);
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        }, 400);

        return () => { cancelled = true; clearTimeout(timer); };
    }, [fetchKey]);

    return { data, loading, dept };
}

// ─── Shared Tooltip ─────────────────────────────────────────────────────────
export function Tip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10">
            <p className="font-bold text-white/70 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-white/50">{p.name}:</span>
                    <span className="font-bold text-white">{p.value?.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
}
