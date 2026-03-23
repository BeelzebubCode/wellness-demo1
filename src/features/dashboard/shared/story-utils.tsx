// src/features/dashboard/shared/story-utils.tsx
// ─────────────────────────────────────────────────────────────────────────────
// SHARED story utils for ALL role dashboards (Dean, Rector, Ministry, Advisor)
// Generic version of head-department/story-utils — parameterized by API path
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
export type DatePreset = "month" | "3m" | "6m" | "year" | "all" | "custom";
export type UnitMode = "count" | "percent";

export function toLocalISODate(d: Date): string {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split("T")[0];
}

export interface DateRange {
    start: string; // YYYY-MM-DD
    end: string;
}

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: "month", label: "เดือนนี้" },
    { value: "3m", label: "3 เดือน" },
    { value: "6m", label: "6 เดือน" },
    { value: "year", label: "ปีนี้" },
    { value: "all", label: "ทั้งหมด" },
    { value: "custom", label: "กำหนดเอง" },
];

export const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

export const INCOME_LABEL: Record<string, string> = {
    UNDER_100K: "< 100K", BETWEEN_100K_200K: "100-200K", BETWEEN_200K_300K: "200-300K",
    BETWEEN_300K_500K: "300-500K", BETWEEN_500K_800K: "500-800K", BETWEEN_800K_1M: "800K-1M",
    OVER_1M: "> 1M", UNKNOWN: "ไม่ระบุ",
};

export const MONTH_LABEL: Record<string, string> = {
    "01": "ม.ค.", "02": "ก.พ.", "03": "มี.ค.", "04": "เม.ย.",
    "05": "พ.ค.", "06": "มิ.ย.", "07": "ก.ค.", "08": "ส.ค.",
    "09": "ก.ย.", "10": "ต.ค.", "11": "พ.ย.", "12": "ธ.ค.",
};

export const RISK_META: Record<string, { label: string; color: string; bg: string }> = {
    "1": { label: "ปกติ", color: "#10b981", bg: "bg-emerald-50" },
    "2": { label: "ต่ำ", color: "#06b6d4", bg: "bg-cyan-50" },
    "3": { label: "ปานกลาง", color: "#f59e0b", bg: "bg-amber-50" },
    "4": { label: "สูง", color: "#f43f5e", bg: "bg-rose-50" },
    "5": { label: "สูงมาก", color: "#7c3aed", bg: "bg-purple-50" },
    // MV risk_band keys (ตรงกับ risk_level_category)
    VERY_LOW: { label: "ปกติ", color: "#10b981", bg: "bg-emerald-50" },
    LOW: { label: "ต่ำ", color: "#06b6d4", bg: "bg-cyan-50" },
    MEDIUM: { label: "ปานกลาง", color: "#f59e0b", bg: "bg-amber-50" },
    HIGH: { label: "สูง", color: "#f43f5e", bg: "bg-rose-50" },
    VERY_HIGH: { label: "สูงมาก", color: "#7c3aed", bg: "bg-purple-50" },
};

export const SERVICE_MODE_OPTIONS = [
    { value: "1", label: "Onsite" },
    { value: "2", label: "Online" }
];

export const RISK_LEVEL_OPTIONS = [
    { value: "4", label: "เสี่ยงสูง" },
    { value: "5", label: "วิกฤต" },
    { value: "3", label: "ปานกลาง" },
    { value: "2", label: "ความเสี่ยงต่ำ" },
    { value: "1", label: "ปกติ" }
];


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
    const end = toLocalISODate(now);
    let start: Date;
    switch (preset) {
        case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "3m": start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
        case "year": start = new Date(now.getFullYear(), 0, 1); break;
        default: start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { start: toLocalISODate(start), end, allTime: false };
}

// ─── Request deduplication + client-side response cache ─────────────────────
const inflightRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, { data: any; ts: number }>();
const CLIENT_CACHE_TTL = 30_000; // 30s — match server-side MV cache

/**
 * When story=all returns, also cache as individual story responses
 * so subsequent story=bookings / story=risk / etc. are instant cache-hits.
 */
function crossPopulateStoryCache(url: string, json: any) {
    try {
        const u = new URL(url);
        if (u.searchParams.get("story") !== "all") return;
        const stories = ["students", "bookings", "problems", "risk"];
        for (const s of stories) {
            if (!json.data?.[s]) continue;
            const singleUrl = new URL(url);
            singleUrl.searchParams.set("story", s);
            const singleJson = {
                success: true,
                data: { [s]: json.data[s], dataRange: json.data.dataRange },
            };
            responseCache.set(singleUrl.toString(), { data: singleJson, ts: Date.now() });
        }
    } catch { /* non-fatal */ }
}

async function dedupFetch(url: string): Promise<any> {
    const cached = responseCache.get(url);
    if (cached && Date.now() - cached.ts < CLIENT_CACHE_TTL) return cached.data;

    const existing = inflightRequests.get(url);
    if (existing) return existing;

    const promise = fetch(url, { credentials: "include", cache: "no-store" })
        .then(async (res) => {
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error);
            responseCache.set(url, { data: json, ts: Date.now() });
            crossPopulateStoryCache(url, json);
            return json;
        })
        .finally(() => { inflightRequests.delete(url); });

    inflightRequests.set(url, promise);
    return promise;
}

/**
 * Call story=all once to warm up cache for all story components.
 * Import this in the page-level component and call it on mount.
 */
export function prefetchAllStories(apiPath: string, universityId?: number) {
    const url = new URL(apiPath, window.location.origin);
    url.searchParams.set("story", "all");
    url.searchParams.set("all_time", "true");
    if (universityId) url.searchParams.set("university_ids", String(universityId));
    dedupFetch(url.toString()).catch(() => { /* silent */ });
}

// ─── Generic Hook: story data fetching (parameterized API path) ─────────────
export function useStoryData<T>(
    apiPath: string,   // e.g. "/api/v2/dashboards/dean/story"
    story: string,
    filters: Record<string, string[]>,
    datePreset: DatePreset,
    customRange?: DateRange,
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>(null);

    const fetchKey = JSON.stringify({ apiPath, story, filters, datePreset, customRange });

    useEffect(() => {
        let cancelled = false;

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const parsed = JSON.parse(fetchKey) as {
                    apiPath: string; story: string; filters: Record<string, string[]>;
                    datePreset: DatePreset; customRange?: DateRange;
                };
                const url = new URL(parsed.apiPath, window.location.origin);
                url.searchParams.set("story", parsed.story);
                const dr = getDateRange(parsed.datePreset, parsed.customRange);
                if (dr.allTime) url.searchParams.set("all_time", "true");
                else {
                    if (dr.start) url.searchParams.set("date_start", dr.start);
                    if (dr.end) url.searchParams.set("date_end", dr.end);
                }
                Object.entries(parsed.filters).forEach(([k, v]) => {
                    if (v.length) url.searchParams.set(k, v.join(","));
                });
                const json = await dedupFetch(url.toString());
                if (cancelled) return;
                setData(json.data?.[parsed.story] ?? null);
                // Save meta (faculty, university, department, etc.)
                const d = json.data || {};
                const { students, bookings, problems, risk, ...rest } = d;
                setMeta(rest);
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        }, 150);

        return () => { cancelled = true; clearTimeout(timer); };
    }, [fetchKey]);

    return { data, loading, meta };
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
