// src/features/dashboard/head-department/components/HeadDeptStatsCards.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Action-oriented KPI cards — "ต้องทำอะไร" not just numbers
// Indigo/violet theme matching Head Department
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Calendar, CheckCircle2, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const API = "/api/v2/dashboards/head-department";

type Preset = "7d" | "30d" | "90d" | "all";

const PRESETS: { value: Preset; label: string }[] = [
    { value: "7d",  label: "7 วัน"  },
    { value: "30d", label: "30 วัน" },
    { value: "90d", label: "90 วัน" },
    { value: "all", label: "ทั้งหมด" },
];

function presetToRange(preset: Preset): { start?: string; end?: string; allTime: boolean } {
    if (preset === "all") return { allTime: true };
    const days  = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
        allTime: false,
        start: start.toISOString().split("T")[0],
        end:   end.toISOString().split("T")[0],
    };
}

interface Stats {
    totalBookings:  number;
    completedCount: number;
    highRiskCount:  number;
    noShowCount:    number;
}

export default function HeadDeptStatsCards() {
    const [stats,   setStats]   = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [preset,  setPreset]  = useState<Preset>("30d");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { allTime, start, end } = presetToRange(preset);
                const params = new URLSearchParams({ story: "all" });
                if (allTime) { params.set("all_time", "true"); }
                else {
                    if (start) params.set("date_start", start);
                    if (end)   params.set("date_end",   end);
                }

                const res  = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (cancelled) return;
                const d = json.data ?? {};
                setStats({
                    totalBookings:  d.bookings?.totalBookings  ?? 0,
                    completedCount: d.bookings?.completedCount ?? 0,
                    highRiskCount:  d.risk?.highRiskCount      ?? 0,
                    noShowCount:    d.bookings?.noShowCount    ?? 0,
                });
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [preset]);

    const total       = stats?.totalBookings  ?? 0;
    const highRisk    = stats?.highRiskCount  ?? 0;
    const noShow      = stats?.noShowCount    ?? 0;
    const completed   = stats?.completedCount ?? 0;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const noShowRate  = total > 0 ? Math.round((noShow    / total) * 100) : 0;

    // Card 1: High-risk students — action-alert style when > 0
    const riskAlert  = !loading && highRisk > 0;
    const card1 = {
        label:  "นิสิตวิกฤต / เสี่ยงสูง",
        value:  loading ? "—" : highRisk.toLocaleString(),
        unit:   loading ? ""  : "ราย",
        sub:    riskAlert ? "⚠ รอการติดตามจากภาควิชา" : loading ? "" : "ไม่มีนิสิตกลุ่มเสี่ยง",
        icon:   <AlertTriangle className="w-5 h-5 text-rose-500" />,
        bg:     riskAlert ? "bg-rose-50"     : "bg-slate-50",
        border: riskAlert ? "border-rose-200" : "border-slate-200",
        text:   riskAlert ? "text-rose-600"   : "text-slate-500",
        pulse:  riskAlert,
    };

    // Card 2: Total bookings
    const card2 = {
        label:  "การนัดหมายทั้งหมด",
        value:  loading ? "—" : total.toLocaleString(),
        unit:   loading ? ""  : "ครั้ง",
        sub:    "",
        icon:   <Calendar className="w-5 h-5 text-indigo-500" />,
        bg:     "bg-indigo-50",
        border: "border-indigo-100",
        text:   "text-indigo-600",
        pulse:  false,
    };

    // Card 3: Success rate
    const card3 = {
        label:  "อัตราสำเร็จ",
        value:  loading ? "—" : `${successRate}%`,
        unit:   "",
        sub:    loading ? "" : `${completed.toLocaleString()} ครั้งสำเร็จ`,
        icon:   <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        bg:     "bg-emerald-50",
        border: "border-emerald-100",
        text:   "text-emerald-600",
        pulse:  false,
    };

    // Card 4: No-show rate — turns rose when > 20%
    const noShowAlert = !loading && noShowRate > 20;
    const card4 = {
        label:  "ไม่มาตามนัด",
        value:  loading ? "—" : `${noShowRate}%`,
        unit:   "",
        sub:    loading ? "" : `${noShow.toLocaleString()} ครั้ง`,
        icon:   <UserX className="w-5 h-5 text-amber-500" />,
        bg:     noShowAlert ? "bg-rose-50"      : "bg-amber-50",
        border: noShowAlert ? "border-rose-100" : "border-amber-100",
        text:   noShowAlert ? "text-rose-600"   : "text-amber-600",
        pulse:  false,
    };

    const cards = [card1, card2, card3, card4];

    return (
        <div className="space-y-3">
            {/* ── Preset date tabs ── */}
            <div className="flex items-center gap-2">
                {PRESETS.map(p => (
                    <button
                        key={p.value}
                        onClick={() => setPreset(p.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            preset === p.value
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── KPI grid ── */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {cards.map((card, idx) => {
                    const Icon = (card.icon as any).type;
                    return (
                        <Card key={idx} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-xs font-medium text-slate-500 leading-snug">
                                    {card.label}
                                </CardTitle>
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                                    <Icon className={`h-4 w-4 ${card.text}`} />
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold tabular-nums text-slate-900">
                                        {card.value}
                                    </span>
                                    {card.unit && <span className="text-xs font-bold text-slate-400">{card.unit}</span>}
                                </div>
                                {card.sub && (
                                    <p className={`text-[11px] mt-0.5 ${card.pulse ? "text-rose-500 font-bold" : "text-slate-400"}`}>
                                        {card.sub}
                                    </p>
                                )}
                            </CardContent>
                            {card.pulse && (
                                <div className="absolute top-2 right-2 flex items-center justify-center">
                                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75 animate-ping" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
