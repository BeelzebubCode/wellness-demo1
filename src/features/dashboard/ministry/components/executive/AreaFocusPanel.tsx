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
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">พื้นที่ต้องโฟกัส</h3>
            </div>

            <div className="p-4 space-y-2">
                {areas.slice(0, 5).map((area, i) => (
                    <div
                        key={area.rank}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        {/* Rank */}
                        <div className={`w-7 h-7 rounded-full ${RANK_BG[i] ?? "bg-slate-300"} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {area.rank}
                        </div>

                        {/* Name + reason */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                {area.type === "university"
                                    ? <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                    : <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                }
                                <span className="text-sm font-semibold text-slate-700 truncate">{area.name}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{area.reason}</p>
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
