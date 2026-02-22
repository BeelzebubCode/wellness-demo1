// src/features/dashboard/shared/StudentRankTable.tsx
"use client";

import React from "react";
import { AlertTriangle, User } from "lucide-react";
import type { StudentRankRow } from "./analytics-types";
import { ChartCard } from "./ChartCard";

function riskBadge(avg: number | null) {
    if (avg == null) return <span className="text-xs text-slate-400">—</span>;
    if (avg >= 4)
        return (
            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {avg.toFixed(1)}
            </span>
        );
    if (avg >= 3)
        return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{avg.toFixed(1)}</span>;
    return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{avg.toFixed(1)}</span>;
}

export function StudentRankTable({
    data,
    loading,
}: {
    data: StudentRankRow[];
    loading?: boolean;
}) {
    return (
        <ChartCard
            title="นิสิตที่มีความเสี่ยงสูงสุด"
            subtitle="เรียงตามคะแนนความเสี่ยงรวม"
            loading={loading}
            isEmpty={data.length === 0}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">#</th>
                            <th className="text-left py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">นิสิต</th>
                            <th className="text-left py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">สาขา</th>
                            <th className="text-center py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Bookings</th>
                            <th className="text-center py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">No Show</th>
                            <th className="text-center py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">สาย</th>
                            <th className="text-center py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Avg Risk</th>
                            <th className="text-center py-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr
                                key={row.studentId}
                                className={`border-b border-slate-50 transition-colors ${i < 3 ? "bg-red-50/30" : "hover:bg-slate-50/60"
                                    }`}
                            >
                                <td className="py-2.5 px-2 font-bold text-slate-400 text-xs">{i + 1}</td>
                                <td className="py-2.5 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-xs leading-tight">
                                                {row.firstName} {row.lastName}
                                            </div>
                                            <div className="text-[10px] text-slate-400">{row.studentCode || "—"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2.5 px-2 text-xs text-slate-600 max-w-[120px] truncate">{row.departmentName}</td>
                                <td className="py-2.5 px-2 text-center text-xs font-semibold text-slate-700">{row.totalBookings}</td>
                                <td className="py-2.5 px-2 text-center">
                                    {row.noShowCount > 0 ? (
                                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {row.noShowCount}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">0</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                    {row.lateCount > 0 ? (
                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {row.lateCount}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">0</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-2 text-center">{riskBadge(row.avgRisk)}</td>
                                <td className="py-2.5 px-2 text-center font-bold text-xs text-slate-800">
                                    {row.riskScore.toFixed(1)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ChartCard>
    );
}
