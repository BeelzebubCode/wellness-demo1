// src/features/dashboard/shared/ProblemCategoryChart.tsx
"use client";

import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie,
} from "recharts";
import type { ProblemCategoryItem } from "./analytics-types";
import { ChartCard } from "./ChartCard";

const BAR_COLORS = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#84cc16",
    "#22c55e", "#14b8a6",
];

const GENDER_COLORS = {
    male: "#3b82f6",
    female: "#ec4899",
    lgbtq: "#a855f7",
    unknown: "#94a3b8",
};

export function ProblemCategoryChart({
    data,
    loading,
}: {
    data: ProblemCategoryItem[];
    loading?: boolean;
}) {
    const top10 = data.filter((d) => d.rank <= 10);

    // Aggregate gender breakdown across all categories
    const genderTotals = data.reduce(
        (acc, d) => ({
            male: acc.male + d.genderBreakdown.male,
            female: acc.female + d.genderBreakdown.female,
            lgbtq: acc.lgbtq + d.genderBreakdown.lgbtq,
            unknown: acc.unknown + d.genderBreakdown.unknown,
        }),
        { male: 0, female: 0, lgbtq: 0, unknown: 0 },
    );

    const genderData = [
        { name: "ชาย", value: genderTotals.male, color: GENDER_COLORS.male },
        { name: "หญิง", value: genderTotals.female, color: GENDER_COLORS.female },
        { name: "LGBTQ+", value: genderTotals.lgbtq, color: GENDER_COLORS.lgbtq },
        { name: "ไม่ระบุ", value: genderTotals.unknown, color: GENDER_COLORS.unknown },
    ].filter((d) => d.value > 0);

    return (
        <ChartCard
            title="ปัญหาที่พบบ่อยสุด"
            subtitle="Top 10 + แยกเพศรวม"
            loading={loading}
            isEmpty={top10.length === 0}
        >
            <div className="flex flex-col lg:flex-row gap-6 w-full">
                {/* Bar chart */}
                <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height={Math.max(250, top10.length * 36)}>
                        <BarChart data={top10} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="categoryNameTh" type="category" width={130} tick={{ fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, fontSize: 12 }}
                                formatter={(value: any, _: any, props: any) => {
                                    const item = props.payload as ProblemCategoryItem;
                                    return [
                                        <div key="t" className="space-y-0.5 text-xs">
                                            <div className="font-bold">{item.categoryNameTh}: {value}</div>
                                            <div className="text-blue-600">ชาย: {item.genderBreakdown.male}</div>
                                            <div className="text-pink-500">หญิง: {item.genderBreakdown.female}</div>
                                            <div className="text-purple-500">LGBTQ+: {item.genderBreakdown.lgbtq}</div>
                                        </div>,
                                        "",
                                    ];
                                }}
                            />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {top10.map((_, i) => (
                                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie chart - gender */}
                <div className="w-full lg:w-[220px] flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-600 mb-2">สัดส่วนเพศรวม</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={genderData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                innerRadius={40}
                                paddingAngle={2}
                                strokeWidth={0}
                            >
                                {genderData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-1">
                        {genderData.map((g) => (
                            <div key={g.name} className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                                <span className="text-[10px] text-slate-600">{g.name}: {g.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ChartCard>
    );
}
