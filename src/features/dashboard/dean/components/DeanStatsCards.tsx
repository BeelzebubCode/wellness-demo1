// features/dashboard/dean/components/DeanStatsCards.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, AlertCircle, TrendingDown } from "lucide-react";

const API = "/api/v2/dashboards/dean/story";

type Preset = "7d" | "30d" | "90d" | "all";

const PRESETS: { value: Preset; label: string }[] = [
    { value: "7d",  label: "7 วัน"  },
    { value: "30d", label: "30 วัน" },
    { value: "90d", label: "90 วัน" },
    { value: "all", label: "ทั้งหมด" },
];

function presetToRange(preset: Preset): { start?: string; end?: string; allTime: boolean } {
    if (preset === "all") return { allTime: true };
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    const end   = new Date();
    const start = new Date(); start.setDate(start.getDate() - days);
    return {
        allTime: false,
        start: start.toISOString().split("T")[0],
        end:   end.toISOString().split("T")[0],
    };
}

interface Stats {
    totalBookings: number;
    completedCount: number;
    highRiskCount: number;
    noShowCount: number;
}

export default function DeanStatsCards() {
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
                else         { if (start) params.set("date_start", start); if (end) params.set("date_end", end); }

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
    const successRate = total > 0 ? Math.round(((stats?.completedCount ?? 0) / total) * 100) : 0;
    const noShowRate  = total > 0 ? Math.round(((stats?.noShowCount    ?? 0) / total) * 100) : 0;

    const cards = [
        {
            label: "การนัดหมายทั้งหมด",
            value: loading ? "—" : total.toLocaleString(),
            unit:  loading ? ""  : "ครั้ง",
            icon:  <Calendar     className="w-5 h-5 text-cyan-500" />,
            bg:    "bg-cyan-50",          border: "border-cyan-100",   text: "text-cyan-600",
            sub:   "",
        },
        {
            label: "อัตราสำเร็จ",
            value: loading ? "—" : `${successRate}%`,
            unit:  "",
            icon:  <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            bg:    "bg-emerald-50",       border: "border-emerald-100", text: "text-emerald-600",
            sub:   loading ? "" : `${(stats?.completedCount ?? 0).toLocaleString()} ครั้งสำเร็จ`,
        },
        {
            label: "นิสิตกลุ่มเสี่ยงสูง",
            value: loading ? "—" : (stats?.highRiskCount ?? 0).toLocaleString(),
            unit:  loading ? ""  : "ราย",
            icon:  <AlertCircle  className="w-5 h-5 text-rose-500" />,
            bg:    "bg-rose-50",          border: "border-rose-100",    text: "text-rose-600",
            sub:   "ต้องติดตามเร่งด่วน",
        },
        {
            label: "อัตราไม่มาตามนัด",
            value: loading ? "—" : `${noShowRate}%`,
            unit:  "",
            icon:  <TrendingDown className="w-5 h-5 text-amber-500" />,
            bg:    !loading && noShowRate > 20 ? "bg-rose-50"   : "bg-amber-50",
            border:!loading && noShowRate > 20 ? "border-rose-100" : "border-amber-100",
            text:  !loading && noShowRate > 20 ? "text-rose-600"   : "text-amber-600",
            sub:   loading ? "" : `${(stats?.noShowCount ?? 0).toLocaleString()} ครั้ง`,
        },
    ];

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
                                ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300 hover:text-cyan-600"
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
                        className={`relative overflow-hidden group rounded-[2rem] border ${card.border} ${card.bg} p-5 transition-all duration-300 hover:shadow-lg`}
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
