"use client";

import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts";
import { LoadIndexItem } from "../../widgets/types/analytics-types";

interface StrategicRiskHeatmapProps {
    data: LoadIndexItem[];
    loading?: boolean;
}

export function StrategicRiskHeatmap({ data, loading }: StrategicRiskHeatmapProps) {
    const chartData = useMemo(() => {
        return [...data]
            .filter((item) => item.totalBookings > 0)
            .map((item) => {
                const riskRate = item.totalBookings > 0 ? (item.highRiskCount / item.totalBookings) : 0;
                return {
                    ...item,
                    riskRate: riskRate * 100, // as percentage
                    riskIndex: (riskRate * 10) + (item.highRiskCount * 0.5), // Custom weighted safety score
                };
            })
            .sort((a, b) => b.highRiskCount - a.highRiskCount)
            .slice(0, 10); // Show top 10 for density
    }, [data]);

    if (loading) {
        return (
            <div className="h-[500px] w-full bg-slate-50 animate-pulse rounded-[2.5rem] border border-slate-100" />
        );
    }

    const CRITICAL_LIMIT = 10;

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden relative group">
            {/* Design Accents */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-700">
                <span className="text-8xl font-black italic tracking-tighter">SAFETY</span>
            </div>

            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 via-pink-400 to-transparent" />

            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full border-4 border-rose-500 border-t-transparent animate-spin duration-1000" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                            จุดเฝ้าระวังความเสี่ยง (Safety Clusters)
                        </h3>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-13">
                        Comparative Analysis: High-Risk Volume by Faculty
                    </p>
                </div>
                <div className="px-4 py-2 bg-rose-50 rounded-2xl border border-rose-100/50">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Critical Threshold: {CRITICAL_LIMIT}+ Cases</span>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 60, left: 40, bottom: 5 }}
                        barGap={10}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            hide
                        />
                        <YAxis
                            dataKey="groupCode"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 800 }}
                            width={50}
                        />
                        <Tooltip
                            cursor={{ fill: "#fff1f2", radius: 12 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as any;
                                    return (
                                        <div className="bg-white/95 backdrop-blur-md border border-rose-100 p-5 rounded-3xl shadow-[0_20px_40px_rgba(225,29,72,0.15)] min-w-[220px]">
                                            <div className="mb-3 pb-3 border-b border-slate-50">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Faculty Unit</p>
                                                <p className="text-sm font-black text-slate-800 leading-tight">{item.groupName}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                        <span className="text-xs font-bold text-slate-500">เคสระดับวิกฤต</span>
                                                    </div>
                                                    <span className="text-sm font-black text-rose-600">{item.highRiskCount} ราย</span>
                                                </div>

                                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-rose-500 rounded-full"
                                                        style={{ width: `${Math.min(item.riskRate, 100)}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="font-bold text-slate-400">SAFETY INDEX</span>
                                                    <span className="font-black text-slate-800">{item.riskIndex?.toFixed(1)} Pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="highRiskCount"
                            radius={[0, 12, 12, 0]}
                            barSize={28}
                            background={{ fill: '#f8fafc', radius: 12 }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.highRiskCount >= CRITICAL_LIMIT ? "url(#roseGradient)" : "url(#pinkGradient)"}
                                    className="filter drop-shadow-sm hover:brightness-105 transition-all cursor-pointer"
                                />
                            ))}
                        </Bar>

                        {/* Gradients Definition */}
                        <defs>
                            <linearGradient id="roseGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#e11d48 text-rose-600" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#be123c text-rose-700" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="pinkGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#fb7185 text-rose-400" stopOpacity={0.7} />
                                <stop offset="100%" stopColor="#f43f5e text-rose-500" stopOpacity={0.9} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">
                        📈
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Observation</p>
                        <p className="text-xs font-bold text-slate-600">วิเคราะห์แรงกดดันรายคณะ</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-rose-50/50 rounded-3xl border border-rose-100/50">
                    <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                        🛡️
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mb-1">Decision Support</p>
                        <p className="text-[11px] font-bold text-rose-700 leading-tight">
                            ความเร่งด่วนในการสนับสนุนทรัพยากร
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
