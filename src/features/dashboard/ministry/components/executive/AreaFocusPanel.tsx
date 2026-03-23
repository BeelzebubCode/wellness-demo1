// src/features/dashboard/ministry/components/executive/AreaFocusPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 📍 Area Focus — Priority-ranked regions + universities
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import { MapPin, Building2, ArrowRight } from "lucide-react";

interface AreaFocus {
    rank: number;
    name: string;
    type: "region" | "university";
    id: number;
    reason: string;
    score: number;
    metrics: { label: string; value: string }[];
}

const RANK_COLORS = [
    "from-rose-500 to-red-600",
    "from-amber-500 to-orange-600",
    "from-yellow-400 to-amber-500",
    "from-blue-400 to-indigo-500",
    "from-slate-400 to-slate-500",
];

export function AreaFocusPanel({ areas }: { areas: AreaFocus[] }) {
    if (!areas.length) return null;

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-100">
                    <MapPin className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">พื้นที่ต้องโฟกัส</h3>
                    <p className="text-xs text-slate-400">เรียงตามความสำคัญ — กดดูรายละเอียดได้</p>
                </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-50">
                {areas.slice(0, 8).map((area, i) => {
                    const gradient = RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
                    const isUni = area.type === "university";
                    const href = isUni ? `/ministry/universities/${area.id}` : undefined;

                    const content = (
                        <div className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/80 transition-colors group">
                            {/* Rank badge */}
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0`}>
                                {area.rank}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    {isUni
                                        ? <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        : <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    }
                                    <span className="text-sm font-bold text-slate-800 truncate">{area.name}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-500 shrink-0">
                                        {area.reason}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {area.metrics.map((m, j) => (
                                        <span key={j} className="text-[11px] text-slate-500">
                                            <span className="font-medium text-slate-400">{m.label}:</span>{" "}
                                            <span className="font-bold text-slate-700">{m.value}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Arrow */}
                            {href && (
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                            )}
                        </div>
                    );

                    return href ? (
                        <a key={area.rank} href={href} className="block">{content}</a>
                    ) : (
                        <div key={area.rank}>{content}</div>
                    );
                })}
            </div>
        </div>
    );
}
