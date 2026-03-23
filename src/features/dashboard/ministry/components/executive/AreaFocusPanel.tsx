// src/features/dashboard/ministry/components/executive/AreaFocusPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Area Focus — simplified top-5 priority list
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import { MapPin, Building2 } from "lucide-react";

interface AreaFocus {
    rank: number;
    name: string;
    type: "region" | "university";
    id: number;
    reason: string;
    score: number;
    metrics: { label: string; value: string }[];
}

const RANK_BG = ["bg-rose-500", "bg-amber-500", "bg-yellow-400", "bg-blue-400", "bg-slate-300"];

export function AreaFocusPanel({ areas }: { areas: AreaFocus[] }) {
    if (!areas.length) return null;

    return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 shadow-sm">
                    <MapPin className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">พื้นที่ต้องโฟกัส</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">พื้นที่เชิงยุทธศาสตร์ที่ควรให้ความสำคัญ</p>
                </div>
            </div>

            <div className="p-5 space-y-3">
                {areas.slice(0, 5).map((area, i) => (
                    <div
                        key={area.rank}
                        className="flex items-center gap-4 px-4 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-xl ${RANK_BG[i] ?? "bg-slate-300"} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                            {area.rank}
                        </div>

                        {/* Name + reason */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                {area.type === "university"
                                    ? <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    : <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                }
                                <span className="text-sm font-bold text-slate-700 truncate">{area.name}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-500">{area.reason}</p>
                        </div>

                        {/* Top metric */}
                        {area.metrics[0] && (
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-slate-700">{area.metrics[0].value}</p>
                                <p className="text-[10px] text-slate-400">{area.metrics[0].label}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
