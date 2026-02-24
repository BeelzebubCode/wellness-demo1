// src/features/dashboard/shared/PsychiatristComparisonChart.tsx
"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { LoadIndexItem } from "./analytics-types";
import { ChartCard } from "./ChartCard";

const COLORS = [
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#14b8a6",
];

export function PsychiatristComparisonChart({
    data,
    loading,
    onBarClick,
    title = "จิตแพทย์ (Mental Health) แบ่งตามคณะ",
    subtitle = "จำนวนเคสที่ขอคำปรึกษาด้านสุขภาพจิต",
}: {
    data: LoadIndexItem[];
    loading?: boolean;
    onBarClick?: (item: LoadIndexItem) => void;
    title?: string;
    subtitle?: string;
}) {
    // Sort by mentalHealthCount descending
    const sorted = [...data]
        .filter(d => d.mentalHealthCount > 0)
        .sort((a, b) => b.mentalHealthCount - a.mentalHealthCount)
        .slice(0, 15);

    return (
        <ChartCard title={title} subtitle={subtitle} loading={loading} isEmpty={sorted.length === 0}>
            <ResponsiveContainer width="100%" height={Math.max(400, sorted.length * 45)}>
                <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis
                        dataKey="groupName"
                        type="category"
                        width={150}
                        tick={{ fontSize: 12, fontWeight: 500, fill: "#334155" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                            borderRadius: 16,
                            border: "none",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            padding: "12px 16px"
                        }}
                        formatter={(value: any) => [
                            <span key="val" className="font-bold text-lg text-slate-800">{value} เคส</span>,
                            <span key="lbl" className="text-slate-500 mr-2">สุขภาพจิต:</span>
                        ]}
                    />
                    <Bar
                        dataKey="mentalHealthCount"
                        radius={[0, 8, 8, 0]}
                        barSize={24}
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
