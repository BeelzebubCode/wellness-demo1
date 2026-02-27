// src/features/dashboard/shared/CancellationSummary.tsx
"use client";

import React, { useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie,
} from "recharts";
import type { CancellationGroupItem } from "../types/analytics-types";
import { ChartCard } from "../cards/ChartCard";

const BAR_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#ec4899", "#a855f7",
    "#8b5cf6", "#6366f1", "#3b82f6", "#14b8a6", "#22c55e",
];

const REASON_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#ec4899", "#a855f7",
    "#8b5cf6", "#6366f1", "#14b8a6",
];

export function CancellationSummary({
    data,
    loading,
}: {
    data: CancellationGroupItem[];
    loading?: boolean;
}) {
    const sorted = [...data].sort((a, b) => b.cancelledCount - a.cancelledCount).slice(0, 12);

    // Aggregate reasons across all groups for the pie chart
    const reasonTotals = useMemo(() => {
        const map = new Map<string, { name: string; count: number }>();
        for (const g of data) {
            for (const r of g.topReasons) {
                const existing = map.get(r.reasonName) || { name: r.reasonName, count: 0 };
                existing.count += r.count;
                map.set(r.reasonName, existing);
            }
        }
        return Array.from(map.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map((r, i) => ({ ...r, color: REASON_COLORS[i % REASON_COLORS.length] }));
    }, [data]);

    return (
        <ChartCard
            title="สถิติการยกเลิก"
            subtitle="จำนวนการยกเลิกตามกลุ่ม + สัดส่วนเหตุผล"
            loading={loading}
            isEmpty={sorted.length === 0}
        >
            <div className="flex flex-col lg:flex-row gap-4 w-full">
                {/* Bar chart — cancellation count per group */}
                <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height={Math.max(250, sorted.length * 32)}>
                        <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="groupName" type="category" width={130} tick={{ fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                                formatter={(value: any, _: any, props: any) => {
                                    const item = props.payload as CancellationGroupItem;
                                    return [
                                        <div key="t" className="space-y-0.5 text-xs">
                                            <div className="font-bold text-red-600">ยกเลิก: {value}</div>
                                            <div className="text-slate-500">อัตรา: {(item.cancelRate * 100).toFixed(1)}%</div>
                                            {item.topReasons.slice(0, 3).map(r => (
                                                <div key={r.reasonId} className="text-slate-600">• {r.reasonName}: {r.count}</div>
                                            ))}
                                        </div>,
                                        "",
                                    ];
                                }}
                            />
                            <Bar dataKey="cancelledCount" radius={[0, 6, 6, 0]}>
                                {sorted.map((_, i) => (
                                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie chart — top cancellation reasons */}
                {reasonTotals.length > 0 && (
                    <div className="w-full lg:w-[200px] flex flex-col items-center">
                        <p className="text-xs font-bold text-slate-600 mb-2">เหตุผลยกเลิก</p>
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={reasonTotals}
                                    dataKey="count"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={65}
                                    innerRadius={35}
                                    paddingAngle={2}
                                    strokeWidth={0}
                                >
                                    {reasonTotals.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 justify-center mt-1">
                            {reasonTotals.map((r) => (
                                <div key={r.name} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                                    <span className="text-[9px] text-slate-500 leading-tight">{r.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ChartCard>
    );
}
