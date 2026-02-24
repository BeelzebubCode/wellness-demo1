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
    LabelList,
} from "recharts";
import { LoadIndexItem } from "../../shared/analytics-types";

interface FacultyVolumeChartProps {
    data: LoadIndexItem[];
    loading?: boolean;
    onBarClick?: (item: LoadIndexItem) => void;
}

export function FacultyVolumeChart({ data, loading, onBarClick }: FacultyVolumeChartProps) {
    const sortedData = useMemo(() => {
        return [...data]
            .filter((item) => item.totalBookings > 0)
            .sort((a, b) => b.totalBookings - a.totalBookings);
    }, [data]);

    if (loading) {
        return (
            <div className="h-96 w-full bg-slate-50 animate-pulse rounded-3xl" />
        );
    }

    // Calculate dynamic height
    const chartHeight = Math.max(400, sortedData.length * 40);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        📊 ปริมาณการใช้งานแยกตามคณะ
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        เรียงลำดับตามจำนวนการจองรับบริการทั้งหมด (All Statuses)
                    </p>
                </div>
            </div>

            <div style={{ height: chartHeight }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                        onClick={(state: any) => {
                            if (state && state.activePayload && onBarClick) {
                                onBarClick(state.activePayload[0].payload);
                            }
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="groupName"
                            type="category"
                            width={150}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                        />
                        <Tooltip
                            cursor={{ fill: "#f8fafc", radius: 8 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as LoadIndexItem;
                                    return (
                                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xl">
                                            <p className="text-xs font-bold text-slate-800 mb-1">{item.groupName}</p>
                                            <p className="text-xs text-slate-600">
                                                จองรวม: <span className="font-bold text-slate-900">{item.totalBookings}</span> รายการ
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="totalBookings"
                            radius={[0, 10, 10, 0]}
                            barSize={20}
                            className="cursor-pointer"
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill="#6366f1"
                                    fillOpacity={0.9 - (index / sortedData.length) * 0.6}
                                />
                            ))}
                            <LabelList
                                dataKey="totalBookings"
                                position="right"
                                style={{ fill: "#475569", fontSize: 12, fontWeight: 700 }}
                                formatter={(val: any) => `${val} เคส`}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
