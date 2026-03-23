// src/features/dashboard/ministry/components/executive/RecommendationPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 🎯 Actionable Recommendations
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import {
    Target, Smartphone, ClipboardList, Megaphone, UserPlus,
    Map, Calendar,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
    "smartphone": <Smartphone className="w-6 h-6" />,
    "clipboard-list": <ClipboardList className="w-6 h-6" />,
    "megaphone": <Megaphone className="w-6 h-6" />,
    "user-plus": <UserPlus className="w-6 h-6" />,
    "map": <Map className="w-6 h-6" />,
    "calendar": <Calendar className="w-6 h-6" />,
};

interface Recommendation {
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    icon: string;
}

const PRIORITY_STYLES = {
    high: {
        badge: "bg-rose-100 text-rose-700 border-rose-200",
        label: "เร่งด่วน",
        ring: "ring-2 ring-rose-100",
    },
    medium: {
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        label: "สำคัญ",
        ring: "ring-2 ring-amber-50",
    },
    low: {
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        label: "ติดตาม",
        ring: "",
    },
};

export function RecommendationPanel({ recommendations }: { recommendations: Recommendation[] }) {
    if (!recommendations.length) return null;

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-100">
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">ข้อเสนอแนะเชิงปฏิบัติ</h3>
                    <p className="text-xs text-slate-400">สิ่งที่ควรดำเนินการ — เรียงตามความเร่งด่วน</p>
                </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-3">
                {recommendations.map((rec) => {
                    const ps = PRIORITY_STYLES[rec.priority];
                    return (
                        <div
                            key={rec.id}
                            className={`rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-all ${ps.ring}`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-slate-400 mt-0.5 shrink-0">
                                    {ICON_MAP[rec.icon] ?? <Target className="w-6 h-6" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ps.badge}`}>
                                            {ps.label}
                                        </span>
                                        <h4 className="text-sm font-bold text-slate-800">{rec.title}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{rec.description}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
