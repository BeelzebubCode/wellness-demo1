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
import { ProblemCategoryItem } from "../../widgets/types/analytics-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

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
            <div className="h-full min-h-[400px] w-full bg-slate-50 animate-pulse rounded-3xl" />
        );
    }

    const chartData = data.slice(0, 8); // Top 8 problems

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden h-full flex flex-col pt-2">
            <CardHeader className="pb-0">
                <CardTitle className="text-lg font-bold text-slate-800 flex flex-col">
                    <div className="flex items-center gap-2">
                        DNA ปัญหา (Policy DNA)
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-1">
                        วิเคราะห์สัดส่วนประเภทปัญหาเพื่อกำหนดทิศทางนโยบาย
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-6 pt-4">
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
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
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                    {chartData.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 truncate mr-1">{item.categoryNameTh}</span>
                            <span className="text-[11px] font-black text-slate-800">{item.count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
