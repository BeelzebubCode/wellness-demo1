// src/features/dashboard/ministry/components/executive/TrendForecastChart.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 📈 Trend + simple linear forecast chart
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface TrendPoint {
    period: string;
    year: number;
    bookings: number;
    checkedIn: number;
    noShow: number;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[180px]">
            <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-[11px] text-slate-500">{p.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 tabular-nums">
                        {Number(p.value).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function TrendForecastChart({ trend }: { trend: TrendPoint[] }) {
    if (!trend.length) return null;

    // Split actual vs forecast
    const isForecast = trend.length > 1 && trend[trend.length - 1].period.includes("คาดการณ์");
    const actualData = isForecast ? trend.slice(0, -1) : trend;
    const forecastPoint = isForecast ? trend[trend.length - 1] : null;

    // Merge for chart — add forecast flag
    const chartData = trend.map((t, i) => ({
        ...t,
        label: t.period,
        isForecast: i === trend.length - 1 && isForecast,
    }));

    return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">แนวโน้ม + คาดการณ์</h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">ข้อมูลรายปี พร้อมเส้นคาดการณ์ปีถัดไป</p>
                    </div>
                </div>
                {forecastPoint && (
                    <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[11px] font-bold border border-violet-100">
                        คาดการณ์ {forecastPoint.period.replace(" (คาดการณ์)", "")}: {forecastPoint.bookings.toLocaleString()} ครั้ง
                    </span>
                )}
            </div>

            {/* Chart */}
            <div className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData} barGap={6}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a78bfa" />
                            </linearGradient>
                            <linearGradient id="barForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#c4b5fd" />
                                <stop offset="100%" stopColor="#e0e7ff" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickFormatter={(v: number) =>
                                v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` :
                                    v >= 1000 ? `${(v / 1000).toFixed(0)}K` :
                                        String(v)
                            }
                            width={55}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            formatter={(v: string) => (
                                <span className="text-[11px] text-slate-500 font-medium">{v}</span>
                            )}
                        />
                        <Bar
                            dataKey="bookings"
                            name="การนัดหมาย"
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                        />
                        <Line
                            dataKey="checkedIn"
                            name="มาตามนัด"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            dataKey="noShow"
                            name="ไม่มา"
                            stroke="#f43f5e"
                            strokeWidth={2}
                            strokeDasharray={isForecast ? "6 3" : "0"}
                            dot={{ r: 3, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
