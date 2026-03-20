// src/features/dashboard/advisor/components/AdvisorStatsCards.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Self-contained KPI cards for Advisor Dashboard — teal/emerald theme
// Preset tabs: 1m / 3m / 6m / all — fetches section=all
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useEffect } from "react";
import { Users, Calendar, ShieldAlert, TrendingUp } from "lucide-react";

const API = "/api/v2/dashboards/advisor/detail";

type Preset = "1m" | "3m" | "6m" | "all";

const PRESETS: { value: Preset; label: string }[] = [
    { value: "1m",  label: "เดือนนี้" },
    { value: "3m",  label: "3 เดือน" },
    { value: "6m",  label: "6 เดือน" },
    { value: "all", label: "ทั้งหมด"  },
];

function presetToRange(preset: Preset): { dateStart?: string; dateEnd?: string } {
    if (preset === "all") return {};
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    let start: Date;
    switch (preset) {
        case "1m": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "3m": start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
        default:   start = new Date(now.getFullYear(), 0, 1);
    }
    return { dateStart: start.toISOString().split("T")[0], dateEnd: end };
}

interface Stats {
    studentsWithBookings: number;
    totalBookings: number;
    highRiskStudents: number;
    topProblem: string;
}

export default function AdvisorStatsCards() {
    const [stats,   setStats]   = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [preset,  setPreset]  = useState<Preset>("all");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { dateStart, dateEnd } = presetToRange(preset);
                const params = new URLSearchParams({ section: "all" });
                if (dateStart) params.set("date_start", dateStart);
                if (dateEnd)   params.set("date_end",   dateEnd);

                const res  = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (cancelled) return;

                const consultations: any[] = json.data?.consultations ?? [];
                const highrisk: any[]      = json.data?.highrisk      ?? [];
                const problems: any[]      = json.data?.problems       ?? [];

                // Deduplicate high-risk students (highrisk may have multiple bookings per student)
                const uniqueHighRisk = new Set(highrisk.map((h: any) => h.studentId)).size;

                // Top problem
                const topProblem = problems.length > 0
                    ? (problems.sort((a: any, b: any) => b.count - a.count)[0]?.category ?? "—")
                    : "—";

                setStats({
                    studentsWithBookings: consultations.length,
                    totalBookings: consultations.reduce((sum: number, s: any) => sum + (s.count ?? 0), 0),
                    highRiskStudents: uniqueHighRisk,
                    topProblem,
                });
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [preset]);

    const riskAlert = !loading && (stats?.highRiskStudents ?? 0) > 0;

    const cards = [
        {
            label:  "นิสิตที่มีการนัดหมาย",
            value:  loading ? "—" : (stats?.studentsWithBookings ?? 0).toLocaleString(),
            unit:   loading ? ""  : "คน",
            sub:    "",
            icon:   <Users className="w-5 h-5 text-teal-500" />,
            bg:     "bg-teal-50",
            border: "border-teal-100",
            text:   "text-teal-600",
            pulse:  false,
        },
        {
            label:  "การนัดหมายทั้งหมด",
            value:  loading ? "—" : (stats?.totalBookings ?? 0).toLocaleString(),
            unit:   loading ? ""  : "ครั้ง",
            sub:    "",
            icon:   <Calendar className="w-5 h-5 text-indigo-500" />,
            bg:     "bg-indigo-50",
            border: "border-indigo-100",
            text:   "text-indigo-600",
            pulse:  false,
        },
        {
            label:  "นิสิตเสี่ยงสูง / วิกฤต",
            value:  loading ? "—" : (stats?.highRiskStudents ?? 0).toLocaleString(),
            unit:   loading ? ""  : "ราย",
            sub:    riskAlert ? "⚠ ต้องติดตามเร่งด่วน" : loading ? "" : "ไม่มีนิสิตกลุ่มเสี่ยง",
            icon:   <ShieldAlert className="w-5 h-5 text-rose-500" />,
            bg:     riskAlert ? "bg-rose-50"      : "bg-slate-50",
            border: riskAlert ? "border-rose-200" : "border-slate-200",
            text:   riskAlert ? "text-rose-600"   : "text-slate-500",
            pulse:  riskAlert,
        },
        {
            label:  "ปัญหาที่พบบ่อยสุด",
            value:  loading ? "—" : (stats?.topProblem ?? "—"),
            unit:   "",
            sub:    "",
            icon:   <TrendingUp className="w-5 h-5 text-emerald-500" />,
            bg:     "bg-emerald-50",
            border: "border-emerald-100",
            text:   "text-emerald-700",
            pulse:  false,
            smallValue: true,
        },
    ] as const;

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
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-600"
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── KPI grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`relative overflow-hidden group rounded-[2rem] border ${card.border} ${card.bg} p-5 transition-all duration-300 hover:shadow-lg animate-[fadeUp_0.5s_ease-out_both]`}
                        style={{ animationDelay: `${idx * 70}ms` }}
                    >
                        {/* Pulse ring for urgent cards */}
                        {card.pulse && (
                            <div className="absolute top-3 right-3 flex items-center justify-center">
                                <span className="absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                            </div>
                        )}

                        {/* bg icon watermark */}
                        <div className="absolute -right-3 -bottom-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            {React.cloneElement(card.icon as React.ReactElement<{ className: string }>, { className: "w-20 h-20" })}
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white rounded-xl shadow-sm">{card.icon}</div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{card.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1 flex-wrap">
                                <span className={`${"smallValue" in card && card.smallValue ? "text-lg" : "text-3xl"} font-black ${card.text} tracking-tight tabular-nums leading-tight`}>
                                    {card.value}
                                </span>
                                {card.unit && <span className="text-sm font-bold text-slate-400">{card.unit}</span>}
                            </div>
                            {card.sub && (
                                <p className={`text-[10px] mt-1 font-medium ${card.pulse ? "text-rose-500 font-bold" : "text-slate-400"}`}>
                                    {card.sub}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
