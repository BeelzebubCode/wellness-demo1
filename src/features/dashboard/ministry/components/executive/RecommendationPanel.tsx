// src/features/dashboard/ministry/components/executive/RecommendationPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Actionable Recommendations — data-driven with real metrics
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import {
    Target, Smartphone, ClipboardList, Megaphone, UserPlus,
    Map, Calendar,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
    "smartphone": <Smartphone className="w-5 h-5" />,
    "clipboard-list": <ClipboardList className="w-5 h-5" />,
    "megaphone": <Megaphone className="w-5 h-5" />,
    "user-plus": <UserPlus className="w-5 h-5" />,
    "map": <Map className="w-5 h-5" />,
    "calendar": <Calendar className="w-5 h-5" />,
};

interface Recommendation {
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    icon: string;
    data?: { label: string; value: string }[];
}

const DOT_COLOR = {
    high: "bg-rose-500",
    medium: "bg-amber-400",
    low: "bg-slate-300",
};

export function RecommendationPanel({ recommendations }: { recommendations: Recommendation[] }) {
    if (!recommendations.length) return null;

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                    <Target className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">ข้อเสนอแนะ</h3>
            </div>

            <div className="p-4 space-y-2">
                {recommendations.map((rec) => (
                    <div
                        key={rec.id}
                        className="px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        {/* Header row */}
                        <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT_COLOR[rec.priority]}`} />
                            <span className="text-slate-400 shrink-0 mt-0.5">
                                {ICON_MAP[rec.icon] ?? <Target className="w-5 h-5" />}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700">{rec.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{rec.description}</p>
                            </div>
                        </div>

                        {/* Data metrics */}
                        {rec.data && rec.data.length > 0 && (
                            <div className="ml-10 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                {rec.data.map((d, j) => (
                                    <div key={j} className="flex items-baseline gap-1.5">
                                        <span className="text-[11px] text-slate-400">{d.label}:</span>
                                        <span className="text-[11px] font-bold text-slate-600">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
