"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { ProblemCategoryItem } from "../../shared/analytics-types";

interface ProblemDNAChartProps {
    data: ProblemCategoryItem[];
    loading?: boolean;
}

const COLORS = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#64748b", // Slate
];

export function ProblemDNAChart({ data, loading }: ProblemDNAChartProps) {
    if (loading) {
        return (
            <div className="h-96 w-full bg-slate-50 animate-pulse rounded-3xl" />
        );
    }

    const chartData = data.slice(0, 8); // Top 8 problems

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    DNA ปัญหา (Policy DNA)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    วิเคราะห์สัดส่วนประเภทปัญหา เพื่อกำหนดทิศทางการจัดโครงการสนับสนุน
                </p>
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="categoryNameTh"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as ProblemCategoryItem;
                                    return (
                                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xl">
                                            <p className="text-xs font-bold text-slate-800 mb-1">{item.categoryNameTh}</p>
                                            <p className="text-xs text-slate-600">
                                                จำนวน: <span className="font-bold text-slate-900">{item.count}</span> เคส
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                {chartData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 truncate mr-1">{item.categoryNameTh}</span>
                        <span className="text-[11px] font-black text-slate-800">{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
