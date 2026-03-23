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
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 shadow-sm">
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">ข้อเสนอแนะ</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">แนวทางดำเนินการเพื่อลดความเสี่ยงในระบบ</p>
                </div>
            </div>

            <div className="p-5 space-y-3">
                {recommendations.map((rec) => (
                    <div
                        key={rec.id}
                        className="px-4 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        {/* Header row */}
                        <div className="flex items-start gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 shadow-sm ${DOT_COLOR[rec.priority]}`} />
                            <span className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
                                {ICON_MAP[rec.icon] ?? <Target className="w-4 h-4" />}
                            </span>
                            <div className="min-w-0 pt-0.5">
                                <p className="text-sm font-bold text-slate-800">{rec.title}</p>
                                <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{rec.description}</p>
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
