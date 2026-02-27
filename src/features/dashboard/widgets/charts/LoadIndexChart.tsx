// src/features/dashboard/shared/LoadIndexChart.tsx
"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { LoadIndexItem } from "../types/analytics-types";
import { ChartCard } from "../cards/ChartCard";

const COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6",
    "#a855f7", "#ec4899",
];

export function LoadIndexChart({
    data,
    loading,
    onBarClick,
    title = "Load/Stress Index",
    subtitle,
}: {
    data: LoadIndexItem[];
    loading?: boolean;
    onBarClick?: (item: LoadIndexItem) => void;
    title?: string;
    subtitle?: string;
}) {
    const sorted = [...data].sort((a, b) => b.loadIndex - a.loadIndex).slice(0, 12);

    return (
        <ChartCard title={title} subtitle={subtitle} loading={loading} isEmpty={sorted.length === 0}>
            <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 40)}>
                <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                        dataKey="groupName"
                        type="category"
                        width={140}
                        tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                        formatter={(value: any, _name: any, props: any) => {
                            const item = props.payload as LoadIndexItem;
                            return [
                                <div key="tip" className="space-y-1 text-xs">
                                    <div className="font-bold text-slate-800">Load Index: {value.toFixed(1)}</div>
                                    <div className="text-slate-500">Bookings: {item.totalBookings}</div>
                                    <div className="text-red-600">High Risk: {item.highRiskCount}</div>
                                    <div className="text-amber-600">No Show: {item.noShowCount} | Late: {item.lateCount}</div>
                                    <div className="text-slate-500">Cancelled: {item.cancelledCount}</div>
                                </div>,
                                "",
                            ];
                        }}
                    />
                    <Bar
                        dataKey="loadIndex"
                        radius={[0, 6, 6, 0]}
                        cursor={onBarClick ? "pointer" : "default"}
                        onClick={(_, index) => {
                            if (onBarClick && sorted[index]) onBarClick(sorted[index]);
                        }}
                    >
                        {sorted.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
