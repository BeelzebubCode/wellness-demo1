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
import { TrendBucket } from "../../widgets/types/analytics-types";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface ComparativeTrendChartProps {
    data: TrendBucket[];
    resolution?: "hour" | "day" | "week" | "month";
    loading?: boolean;
}

export function ComparativeTrendChart({ data, resolution = "day", loading }: ComparativeTrendChartProps) {
    if (loading) {
        return (
            <div className="h-full min-h-[400px] w-full bg-slate-50 animate-pulse rounded-3xl" />
        );
    }

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden h-full flex flex-col pt-2">
            <CardHeader className="pb-0">
                <CardTitle className="text-lg font-bold text-slate-800 flex flex-col">
                    <div className="flex items-center gap-2">
                        📈 แนวโน้มความต้องการรับบริการ
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-1">
                        แสดงจำนวนการจองตามช่วงเวลาที่กรอง (Daily/Weekly/Monthly)
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 min-h-[350px] p-6 pt-4">
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
                                if (resolution === "hour") {
                                    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                                }
                                if (resolution === "month") {
                                    return date.toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
                                }
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
                                    let dateLabel = date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

                                    if (resolution === "hour") {
                                        dateLabel = `${date.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} • ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
                                    } else if (resolution === "week") {
                                        dateLabel = `สัปดาห์ที่ ${date.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`;
                                    } else if (resolution === "month") {
                                        dateLabel = date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
                                    }

                                    return (
                                        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl">
                                            <p className="text-[10px] font-bold text-slate-400 mb-1">
                                                {dateLabel}
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
            </CardContent>
        </Card>
    );
}
