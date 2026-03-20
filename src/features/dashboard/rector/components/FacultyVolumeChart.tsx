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
} from "recharts";
import { LoadIndexItem } from "../../widgets/types/analytics-types";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

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
            <div className="h-full min-h-[400px] w-full bg-slate-50 animate-pulse rounded-3xl" />
        );
    }

    // Calculate dynamic height but cap it with scroll for symmetry
    const chartHeight = Math.max(300, sortedData.length * 45);

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden h-full flex flex-col pt-2">
            <CardHeader className="pb-0">
                <CardTitle className="text-lg font-bold text-slate-800 flex flex-col">
                    <div className="flex items-center gap-2">
                        📊 ปริมาณการใช้งานแยกตามคณะ
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-1">
                        จำนวนการจองรับบริการทั้งหมดเรียงความหนาแน่น
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-6 pt-4">
                <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                    <div style={{ height: chartHeight }} className="w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={sortedData}
                                layout="vertical"
                                margin={{ top: 5, right: 16, left: 10, bottom: 5 }}
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
                                    width={140}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
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
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
