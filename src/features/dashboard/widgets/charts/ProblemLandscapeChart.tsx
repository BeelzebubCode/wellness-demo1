// src/features/dashboard/shared/ProblemLandscapeChart.tsx
"use client";

import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { ProblemCategoryItem } from "../types/analytics-types";
import { ChartCard } from "../cards/ChartCard";

const BAR_COLORS = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#84cc16",
    "#22c55e", "#14b8a6",
];

export function ProblemLandscapeChart({
    data,
    loading,
}: {
    data: ProblemCategoryItem[];
    loading?: boolean;
}) {
    // Show all data provided by API (now up to 100)
    const sortedData = [...data].sort((a, b) => b.count - a.count);

    return (
        <ChartCard
            title="ภาพรวมประเด็นปัญหาทั้งหมด (Problem Landscape)"
            subtitle="จัดลำดับปัญหาตามจำนวนนิสิตที่เข้าใช้บริการ"
            loading={loading}
            isEmpty={sortedData.length === 0}
        >
            <div className="w-full h-[600px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ left: 40, right: 40, top: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                        <XAxis
                            type="number"
                            hide
                        />
                        <YAxis
                            dataKey="categoryNameTh"
                            type="category"
                            width={160}
                            tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '13px'
                            }}
                            formatter={(value: any, _: any, props: any) => {
                                const item = props.payload as ProblemCategoryItem;
                                return [
                                    <div key="t" className="space-y-1">
                                        <div className="font-bold text-slate-900">{item.categoryNameTh}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="font-medium text-primary">{value} เคส</span>
                                        </div>
                                    </div>,
                                    ""
                                ];
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[0, 8, 8, 0]}
                            barSize={24}
                        >
                            {sortedData.map((_, i) => (
                                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                            ))}
                        </Bar>
                        {/* Custom Label in Bar */}
                        <XAxis type="number" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">คำแนะนำ:</div>
                <p className="text-xs text-slate-400 font-medium">
                    กราฟนี้แสดงสถิติการขอรับคำปรึกษาแยกตามหัวข้อปัญหาหลักทั้งหมดที่บันทึกในระบบ ช่วยให้ระบุกลุ่มปัญหาที่มีความถี่สูงเพื่อกำหนดนโยบายเชิงป้องกันได้แม่นยำขึ้น
                </p>
            </div>
        </ChartCard>
    );
}
