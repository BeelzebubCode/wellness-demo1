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

const GRADIENT_MAP: Record<string, string> = {
    "users": "from-blue-500 to-indigo-600",
    "check-circle": "from-emerald-500 to-teal-600",
    "user-x": "from-amber-500 to-orange-600",
    "alert-triangle": "from-rose-500 to-red-600",
};

function TrendBadge({ kpi }: { kpi: KPI }) {
    if (kpi.trend === 0) return null;

    const isGood = kpi.trendIsGood;
    const bg = isGood ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
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
                    className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    {/* Top gradient bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${GRADIENT_MAP[kpi.icon] ?? "from-slate-400 to-slate-500"}`} />

                    <div className="p-5 pt-6">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${GRADIENT_MAP[kpi.icon] ?? "from-slate-400 to-slate-500"} text-white shadow-lg shadow-slate-200`}>
                                {ICON_MAP[kpi.icon] ?? <Users className="w-5 h-5" />}
                            </div>
                            <TrendBadge kpi={kpi} />
                        </div>

                        <div className="space-y-1">
                            <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                                {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                                <span className="text-sm font-medium text-slate-400 ml-1">{kpi.suffix}</span>
                            </p>
                            <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
