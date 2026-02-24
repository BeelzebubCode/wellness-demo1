"use client";

import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TrendBucket } from "../../shared/analytics-types";

interface ComparativeTrendChartProps {
    data: TrendBucket[];
    loading?: boolean;
}

export function ComparativeTrendChart({ data, loading }: ComparativeTrendChartProps) {
    if (loading) {
        return (
            <div className="h-80 w-full bg-slate-50 animate-pulse rounded-3xl" />
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        📈 แนวโน้มความต้องการรับบริการ
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        แสดงจำนวนการจองตามช่วงเวลาที่กรอง (Daily/Weekly/Monthly)
                    </p>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="bucket"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            tickFormatter={(val) => {
                                const date = new Date(val);
                                return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as TrendBucket;
                                    const date = new Date(item.bucket);
                                    return (
                                        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl">
                                            <p className="text-[10px] font-bold text-slate-400 mb-1">
                                                {date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <p className="text-xs text-slate-600">
                                                    จองรวม: <span className="font-bold text-slate-900">{item.totalBookings}</span> รายการ
                                                </p>
                                            </div>
                                            {item.highRiskCount > 0 && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <p className="text-xs text-slate-600">
                                                        เสี่ยงสูง: <span className="font-bold text-rose-600">{item.highRiskCount}</span> เคส
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="totalBookings"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
