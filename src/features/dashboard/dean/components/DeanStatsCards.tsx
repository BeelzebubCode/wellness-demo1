// features/dashboard/dean/components/DeanStatsCards.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, AlertCircle, TrendingDown, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { DateCalendarPopover } from "@/components/filters/inputs/DateCalendarPopover";

const API = "/api/v2/dashboards/dean/story";

type Preset = "7d" | "30d" | "90d" | "all" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
    { value: "7d", label: "7 วัน" },
    { value: "30d", label: "30 วัน" },
    { value: "90d", label: "90 วัน" },
    { value: "all", label: "ทั้งหมด" },
    { value: "custom", label: "ระบุเอง" },
];

function presetToRange(
    preset: Preset,
    customStart?: string,
    customEnd?: string
): { start?: string; end?: string; allTime: boolean } {
    if (preset === "all") return { allTime: true };
    if (preset === "custom") {
        return {
            allTime: false,
            start: customStart,
            end: customEnd,
        };
    }
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
    totalBookings: number;
    completedCount: number;
    highRiskCount: number;
    noShowCount: number;
}

export default function DeanStatsCards({ theme = "light" }: { theme?: "light" | "dark" }) {
    const isDark = theme === "dark";
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState<Preset>("30d");
    const [customStart, setCustomStart] = useState<string | undefined>();
    const [customEnd, setCustomEnd] = useState<string | undefined>();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { allTime, start, end } = presetToRange(preset, customStart, customEnd);
                const params = new URLSearchParams({ story: "all" });
                if (allTime) { params.set("all_time", "true"); }
                else { if (start) params.set("date_start", start); if (end) params.set("date_end", end); }

                const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (cancelled) return;
                const d = json.data ?? {};
                setStats({
                    totalBookings: d.bookings?.totalBookings ?? 0,
                    completedCount: d.bookings?.completedCount ?? 0,
                    highRiskCount: d.risk?.highRiskCount ?? 0,
                    noShowCount: d.bookings?.noShowCount ?? 0,
                });
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [preset, customStart, customEnd]);

    const total = stats?.totalBookings ?? 0;
    const successRate = total > 0 ? Math.round(((stats?.completedCount ?? 0) / total) * 100) : 0;
    const noShowRate = total > 0 ? Math.round(((stats?.noShowCount ?? 0) / total) * 100) : 0;

    const cards = [
        {
            label: "การนัดหมายทั้งหมด",
            value: loading ? "—" : total.toLocaleString(),
            unit: loading ? "" : "ครั้ง",
            icon: Calendar,
            gradient: "from-pink-400 to-rose-500",
            iconBg: "bg-pink-50",
            iconColor: "text-pink-600",
            glow: "shadow-[var(--tw-shadow-color)] shadow-pink-500/5",
            sub: "จำนวนการนัดหมาย",
            trendIcon: <Clock className="w-3.5 h-3.5 text-pink-500 mr-1.5" />
        },
        {
            label: "อัตราสำเร็จ",
            value: loading ? "—" : `${successRate}%`,
            unit: "",
            icon: CheckCircle2,
            gradient: "from-emerald-400 to-teal-500",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            glow: "shadow-[var(--tw-shadow-color)] shadow-emerald-500/5",
            sub: loading ? "" : `${(stats?.completedCount ?? 0).toLocaleString()} ครั้งสำเร็จ`,
            trendIcon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
        },
        {
            label: "นิสิตกลุ่มเสี่ยงสูง",
            value: loading ? "—" : (stats?.highRiskCount ?? 0).toLocaleString(),
            unit: loading ? "" : "ราย",
            icon: AlertCircle,
            gradient: "from-rose-400 to-pink-500",
            iconBg: "bg-rose-50",
            iconColor: "text-rose-600",
            glow: "shadow-[var(--tw-shadow-color)] shadow-rose-500/5",
            sub: "ต้องติดตามเร่งด่วน",
            trendIcon: <AlertCircle className="w-3.5 h-3.5 text-rose-500 mr-1.5" />
        },
        {
            label: "อัตราไม่มาตามนัด",
            value: loading ? "—" : `${noShowRate}%`,
            unit: "",
            icon: TrendingDown,
            gradient: !loading && noShowRate > 20 ? "from-red-400 to-rose-500" : "from-amber-400 to-orange-500",
            iconBg: !loading && noShowRate > 20 ? "bg-red-50" : "bg-amber-50",
            iconColor: !loading && noShowRate > 20 ? "text-red-600" : "text-amber-600",
            glow: !loading && noShowRate > 20 ? "shadow-[var(--tw-shadow-color)] shadow-red-500/5" : "shadow-[var(--tw-shadow-color)] shadow-amber-500/5",
            sub: loading ? "" : `${(stats?.noShowCount ?? 0).toLocaleString()} ครั้ง`,
            trendIcon: <ArrowDownRight className={`w-3.5 h-3.5 ${!loading && noShowRate > 20 ? 'text-red-500' : 'text-amber-500'} mr-1.5`} />
        },
    ];

    return (
        <div className="space-y-6">
            {/* ── Header & Preset Tabs ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-xl font-extrabold bg-clip-text text-transparent ${isDark ? "bg-gradient-to-r from-slate-100 to-slate-400" : "bg-gradient-to-r from-slate-800 to-slate-500"}`}>
                        ภาพรวมสถิติการใช้งาน
                    </h2>
                    <p className={`text-sm font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                        Performance Metrics
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3 z-20">
                    <div className={`flex items-center p-1.5 rounded-2xl border backdrop-blur-sm shadow-inner w-fit ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-slate-100/80 border-slate-200/50"}`}>
                        {PRESETS.map(p => {
                            const isActive = preset === p.value;
                            return (
                                <button
                                    key={p.value}
                                    onClick={() => setPreset(p.value)}
                                    className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${isActive
                                        ? (isDark ? "text-white" : "text-slate-800")
                                        : (isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="deanStatsPresetBubble"
                                            className={`absolute inset-0 shadow-sm rounded-xl ${isDark ? "bg-slate-700 shadow-black/20" : "bg-white border border-slate-200/60"}`}
                                            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10">{p.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {preset === "custom" && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-wrap items-center justify-end gap-3 origin-top-right z-30 relative"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">ตั้งแต่:</span>
                                    <div className="w-36">
                                        <DateCalendarPopover
                                            valueYMD={customStart}
                                            onChangeYMD={setCustomStart}
                                            placeholder="วว/ดด/ปปปป"
                                            variant="compact"
                                            closeOnSelect
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">ถึง:</span>
                                    <div className="w-36">
                                        <DateCalendarPopover
                                            valueYMD={customEnd}
                                            onChangeYMD={setCustomEnd}
                                            placeholder="วว/ดด/ปปปป"
                                            variant="compact"
                                            closeOnSelect
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── KPI grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
                <AnimatePresence mode="popLayout">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                            className={`group relative overflow-hidden rounded-[2rem] p-7 border transition-all duration-300 ${card.glow} ${isDark ? "bg-slate-900/40 border-slate-700/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/5 hover:border-slate-600" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl"}`}
                        >
                            {/* Decorative Background Gradient Orbs */}
                            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 blur-2xl group-hover:scale-150 transition-all duration-700`} />

                            {/* Giant Watermark Icon */}
                            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.04] group-hover:scale-110 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
                                <card.icon strokeWidth={1} className="w-32 h-32" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                {/* Header */}
                                <div className="flex items-center gap-3.5 mb-5">
                                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center ${card.iconBg} ${card.iconColor} ring-1 ring-inset ring-slate-100/50 group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                                        <card.icon strokeWidth={2.5} className="w-5 h-5" />
                                    </div>
                                    <h3 className={`text-[14px] font-bold tracking-wide leading-tight line-clamp-2 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                                        {card.label}
                                    </h3>
                                </div>

                                {/* Body */}
                                <div className="mt-auto">
                                    <div className="flex items-baseline gap-1.5 mb-1.5">
                                        {loading ? (
                                            <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
                                        ) : (
                                            <span className={`text-[2.75rem] leading-none font-black tracking-tight tabular-nums ${isDark ? "text-white" : "text-slate-800"}`}>
                                                {card.value}
                                            </span>
                                        )}
                                        {card.unit && !loading && (
                                            <span className={`text-sm font-bold translate-y-[-4px] ${isDark ? "text-slate-400" : "text-slate-400"}`}>{card.unit}</span>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className={`flex items-center mt-4 text-[12px] font-semibold w-fit px-3 py-1.5 rounded-lg border transition-colors duration-300 ${isDark ? "text-slate-300 bg-slate-800/80 border-slate-700/50 group-hover:bg-slate-800" : "text-slate-500 bg-slate-50/80 border-slate-100 group-hover:bg-slate-100"}`}>
                                        {card.trendIcon}
                                        {loading ? "กำลังโหลด..." : (card.sub || "อัปเดตล่าสุด")}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
