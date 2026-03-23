// src/features/dashboard/super-admin/components/SuperAdminStatsCards.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Building2, Users, CalendarCheck2, AlertCircle } from "lucide-react";

// Reuse the ministry story endpoint for national-level data
const API = "/api/v2/dashboards/ministry/story";

type Preset = "7d" | "30d" | "90d" | "all";

const PRESETS: { value: Preset; label: string }[] = [
    { value: "7d", label: "7 วัน" },
    { value: "30d", label: "30 วัน" },
    { value: "90d", label: "90 วัน" },
    { value: "all", label: "ทั้งหมด" },
];

function presetToRange(preset: Preset): { start?: string; end?: string; allTime: boolean } {
    if (preset === "all") return { allTime: true };
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate() - days);
    return {
        allTime: false,
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
    };
}

interface Stats {
    totalUniversities: number;
    totalStudents: number;
    totalBookings: number;
    highRiskCount: number;
}

export function SuperAdminStatsCards() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState<Preset>("all");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { allTime, start, end } = presetToRange(preset);
                const params = new URLSearchParams({ story: "all" });
                if (allTime) { params.set("all_time", "true"); }
                else { if (start) params.set("date_start", start); if (end) params.set("date_end", end); }

                const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (cancelled) return;

                const d = json.data ?? {};
                setStats({
                    totalUniversities: d.scope?.totalUniversities ?? 0,
                    totalStudents: d.students?.totalStudentCount ?? 0,
                    totalBookings: d.bookings?.totalBookings ?? 0,
                    highRiskCount: d.risk?.highRiskCount ?? 0,
                });
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [preset]);

    const cards = [
        {
            label: "มหาวิทยาลัยในระบบ",
            value: loading ? "—" : (stats?.totalUniversities ?? 0).toLocaleString(),
            unit: loading ? "" : "แห่ง",
            icon: <Building2 className="w-5 h-5 text-blue-500" />,
            bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600",
            sub: "ที่ใช้งานระบบในขณะนี้",
        },
        {
            label: "นิสิตทั้งหมด",
            value: loading ? "—" : (stats?.totalStudents ?? 0).toLocaleString(),
            unit: loading ? "" : "คน",
            icon: <Users className="w-5 h-5 text-indigo-500" />,
            bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-600",
            sub: "ที่มีประวัติในระบบ",
        },
        {
            label: "การนัดหมายทั้งหมด",
            value: loading ? "—" : (stats?.totalBookings ?? 0).toLocaleString(),
            unit: loading ? "" : "ครั้ง",
            icon: <CalendarCheck2 className="w-5 h-5 text-emerald-500" />,
            bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600",
            sub: "ในช่วงเวลาที่เลือก",
        },
        {
            label: "เคสความเสี่ยงสูง",
            value: loading ? "—" : (stats?.highRiskCount ?? 0).toLocaleString(),
            unit: loading ? "" : "ราย",
            icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
            bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-600",
            sub: "มีระดับความเสี่ยงที่ 4-5",
        },
    ];

    return (
        <div className="space-y-3">
            {/* ── Preset date tabs ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {PRESETS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPreset(p.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${preset === p.value
                                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── KPI grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`relative overflow-hidden group rounded-[2rem] border ${card.border} ${card.bg} p-5 transition-all duration-300 hover:shadow-lg animate-[fadeUp_0.5s_ease-out_both]`}
                        style={{ animationDelay: `${idx * 70}ms` }}
                    >
                        {/* bg icon watermark */}
                        <div className="absolute -right-3 -bottom-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            {React.cloneElement(card.icon as React.ReactElement<{ className: string }>, { className: "w-20 h-20" })}
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white rounded-xl shadow-sm">{card.icon}</div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{card.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-black ${card.text} tracking-tight tabular-nums`}>{card.value}</span>
                                {card.unit && <span className="text-sm font-bold text-slate-400">{card.unit}</span>}
                            </div>
                            {card.sub && <p className="text-[10px] text-slate-400 mt-1 font-medium">{card.sub}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
