// src/features/dashboard/ministry/components/executive/ExecutiveKPIStrip.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 4 KPI cards with trend arrows for executive dashboard
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import { Users, CheckCircle, UserX, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPI {
    label: string;
    value: number;
    suffix: string;
    trend: number;
    trendDirection: "up" | "down" | "flat";
    trendIsGood: boolean;
    icon: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
    "users": <Users className="w-5 h-5" />,
    "check-circle": <CheckCircle className="w-5 h-5" />,
    "user-x": <UserX className="w-5 h-5" />,
    "alert-triangle": <AlertTriangle className="w-5 h-5" />,
};

const COLOR_MAP: Record<string, string> = {
    "users": "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50",
    "check-circle": "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50",
    "user-x": "bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100/50",
    "alert-triangle": "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50",
};

const LINE_MAP: Record<string, string> = {
    "users": "bg-blue-500",
    "check-circle": "bg-emerald-500",
    "user-x": "bg-orange-500",
    "alert-triangle": "bg-rose-500",
};

function TrendBadge({ kpi }: { kpi: KPI }) {
    if (kpi.trend === 0) return null;

    const isGood = kpi.trendIsGood;
    const bg = isGood ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100";
    const Icon = kpi.trendDirection === "up" ? TrendingUp : kpi.trendDirection === "down" ? TrendingDown : Minus;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${bg}`}>
            <Icon className="w-3 h-3" />
            {kpi.trend}%
        </span>
    );
}

export function ExecutiveKPIStrip({ kpis }: { kpis: KPI[] }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
                <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 group"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    {/* Top line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${LINE_MAP[kpi.icon] ?? "bg-slate-400"}`} />

                    <div className="p-5 pt-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl border shadow-sm ${COLOR_MAP[kpi.icon] ?? "bg-slate-50 text-slate-600 border-slate-100"}`}>
                                {ICON_MAP[kpi.icon] ?? <Users className="w-6 h-6" />}
                            </div>
                            <TrendBadge kpi={kpi} />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 mt-2">
                                <span className="text-xl lg:text-2xl font-black text-slate-800 tabular-nums tracking-tighter break-all">
                                    {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                                </span>
                                <span className="text-xs lg:text-sm font-semibold text-slate-400 tracking-normal shrink-0">{kpi.suffix}</span>
                            </div>
                            <p className="text-xs lg:text-sm text-slate-500 font-medium leading-snug">{kpi.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
