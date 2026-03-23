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
    info: "border-l-blue-500 bg-blue-50/50",
    success: "border-l-emerald-500 bg-emerald-50/50",
    warning: "border-l-amber-500 bg-amber-50/50",
    critical: "border-l-rose-500 bg-rose-50/50",
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
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-100">
                    <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Key Insights</h3>
                    <p className="text-xs text-slate-400">สิ่งสำคัญที่ผู้บริหารควรรู้</p>
                </div>
            </div>

            {/* Insight Items */}
            <div className="divide-y divide-slate-50">
                {insights.map((insight, i) => (
                    <div
                        key={insight.id}
                        className={`px-6 py-4 border-l-4 ${SEVERITY_STYLES[insight.severity]} hover:bg-slate-50/80 transition-colors`}
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 shrink-0 text-slate-500">
                                {ICON_MAP[insight.icon] ?? <Lightbulb className="w-4 h-4" />}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-slate-800">{insight.title}</h4>
                                    {insight.metric && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SEVERITY_BADGE[insight.severity]}`}>
                                            {insight.metric.value.toLocaleString()}{insight.metric.suffix}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
