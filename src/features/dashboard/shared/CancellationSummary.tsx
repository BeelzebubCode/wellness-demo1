// src/features/dashboard/shared/CancellationSummary.tsx
"use client";

import React from "react";
import type { CancellationGroupItem } from "./analytics-types";
import { ChartCard } from "./ChartCard";
import { XCircle } from "lucide-react";

export function CancellationSummary({
    data,
    loading,
}: {
    data: CancellationGroupItem[];
    loading?: boolean;
}) {
    const sorted = [...data].sort((a, b) => b.cancelledCount - a.cancelledCount).slice(0, 10);

    return (
        <ChartCard
            title="สถิติการยกเลิก"
            subtitle="ตามกลุ่ม + เหตุผลยกเลิก"
            loading={loading}
            isEmpty={sorted.length === 0}
        >
            <div className="w-full space-y-3">
                {sorted.map((g) => (
                    <div key={g.groupId} className="border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className="text-xs font-bold text-slate-800">{g.groupName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-red-600">{g.cancelledCount}</span>
                                <span className="text-[10px] text-slate-500">({(g.cancelRate * 100).toFixed(1)}%)</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all"
                                style={{ width: `${Math.min(g.cancelRate * 100, 100)}%` }}
                            />
                        </div>

                        {/* Top reasons */}
                        {g.topReasons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {g.topReasons.slice(0, 3).map((r) => (
                                    <span
                                        key={r.reasonId}
                                        className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-100"
                                    >
                                        {r.reasonName} ({r.count})
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}
