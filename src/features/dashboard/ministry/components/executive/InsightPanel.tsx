// src/features/dashboard/ministry/components/executive/InsightPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 🔥 Key Insights panel — auto-generated from data with severity colors
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import {
    Lightbulb, BarChart3, TrendingUp, TrendingDown, Trophy,
    AlertTriangle, ShieldAlert,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
    "bar-chart-3": <BarChart3 className="w-4 h-4" />,
    "trending-up": <TrendingUp className="w-4 h-4" />,
    "trending-down": <TrendingDown className="w-4 h-4" />,
    "trophy": <Trophy className="w-4 h-4" />,
    "alert-triangle": <AlertTriangle className="w-4 h-4" />,
    "shield-alert": <ShieldAlert className="w-4 h-4" />,
};

interface Insight {
    id: string;
    icon: string;
    title: string;
    description: string;
    severity: "info" | "success" | "warning" | "critical";
    metric?: { value: number; suffix: string };
}

const SEVERITY_STYLES = {
    info: "border-blue-100 bg-blue-50/30 hover:bg-blue-50/80 shadow-sm shadow-blue-100/30",
    success: "border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/80 shadow-sm shadow-emerald-100/30",
    warning: "border-amber-100 bg-amber-50/30 hover:bg-amber-50/80 shadow-sm shadow-amber-100/30",
    critical: "border-rose-100 bg-rose-50/30 hover:bg-rose-50/80 shadow-sm shadow-rose-100/30",
};

const SEVERITY_ICON_BG = {
    info: "bg-blue-100 text-blue-600",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    critical: "bg-rose-100 text-rose-600",
};

const SEVERITY_BADGE = {
    info: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-rose-100 text-rose-700",
};

export function InsightPanel({ insights }: { insights: Insight[] }) {
    if (!insights.length) return null;

    return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shadow-sm">
                    <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Key Insights</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">สิ่งสำคัญที่ผู้บริหารควรรู้</p>
                </div>
            </div>

            {/* Insight Items */}
            <div className="p-5 space-y-3">
                {insights.map((insight, i) => (
                    <div
                        key={insight.id}
                        className={`p-4 rounded-xl border transition-all ${SEVERITY_STYLES[insight.severity]}`}
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl shrink-0 ${SEVERITY_ICON_BG[insight.severity]}`}>
                                {ICON_MAP[insight.icon] ?? <Lightbulb className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="text-sm font-bold text-slate-800">{insight.title}</h4>
                                    {insight.metric && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SEVERITY_BADGE[insight.severity]}`}>
                                            {insight.metric.value.toLocaleString()}{insight.metric.suffix}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
