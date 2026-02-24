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
import { LoadIndexItem } from "../../shared/analytics-types";

interface StrategicRiskHeatmapProps {
    data: LoadIndexItem[];
    loading?: boolean;
}

export function StrategicRiskHeatmap({ data, loading }: StrategicRiskHeatmapProps) {
    const chartData = useMemo(() => {
        return [...data]
            .filter((item) => item.totalBookings > 0) // Show all faculties with at least one booking
            .map((item) => ({
                ...item,
                avgRisk: item.totalBookings > 0 ? (item.highRiskCount / item.totalBookings) * 5 : 0, // Mocking avg risk logic for visualization
            }))
            .sort((a, b) => b.highRiskCount - a.highRiskCount);
    }, [data]);

    if (loading) {
        return (
            <div className="h-96 w-full bg-slate-50 animate-pulse rounded-3xl" />
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <span className="text-6xl font-black">SAFETY</span>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    จุดเฝ้าระวังความเสี่ยง (Safety Clusters)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    เปรียบเทียบจำนวนเคส "ระดับเสี่ยงสูง" (Level 4-5) แยกตามคณะ
                </p>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="groupCode"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <Tooltip
                            cursor={{ fill: "#fff1f2", radius: 8 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as LoadIndexItem;
                                    return (
                                        <div className="bg-white border-2 border-rose-100 p-3 rounded-2xl shadow-xl">
                                            <p className="text-xs font-bold text-slate-800 mb-2">{item.groupName}</p>
                                            <div className="flex items-center gap-2 text-rose-600">
                                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                <p className="text-xs font-bold">
                                                    เคสวิกฤต: {item.highRiskCount} ราย
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">สัดส่วนความเสี่ยงสูงต่อทั้งหมด</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine y={10} label={{ value: 'CRITICAL THRESHOLD', position: 'insideTopRight', fill: '#be123c', fontSize: 9, fontWeight: 900 }} stroke="#fda4af" strokeDasharray="5 5" />
                        <Bar
                            dataKey="highRiskCount"
                            radius={[10, 10, 0, 0]}
                            barSize={32}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.highRiskCount > 10 ? "#e11d48" : "#fb7185"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 flex items-center gap-2 p-3 bg-rose-50 rounded-2xl border border-rose-100/50">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    ⚠️
                </div>
                <p className="text-[11px] text-rose-700 leading-snug">
                    <span className="font-bold">Recommendation:</span> คณะที่มีแท่งกราฟสีแดงเข้มมีสัดส่วนนิสิตเสี่ยงสูงเกินเกณฑ์มาตรฐาน ควรพิจารณาเพิ่มชั่วโมงการให้คำปรึกษาหรือจัดทีมเคลื่อนที่เร็วเข้าสนับสนุน
                </p>
            </div>
        </div>
    );
}
