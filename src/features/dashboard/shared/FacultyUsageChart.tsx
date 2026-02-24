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
import { LoadIndexItem } from "./analytics-types";

interface FacultyUsageChartProps {
    data: LoadIndexItem[];
    loading?: boolean;
    onBarClick?: (item: LoadIndexItem) => void;
}

export function FacultyUsageChart({ data, loading, onBarClick }: FacultyUsageChartProps) {
    const sortedData = useMemo(() => {
        return [...data]
            .filter((item) => item.completedCount > 0)
            .sort((a, b) => b.completedCount - a.completedCount);
    }, [data]);

    if (loading) {
        return (
            <div className="h-96 w-full bg-slate-50 animate-pulse rounded-3xl flex items-center justify-center">
                <span className="text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลการใช้งาน...</span>
            </div>
        );
    }

    if (sortedData.length === 0) {
        return (
            <div className="h-96 w-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/30 p-8 text-center">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 text-xl">
                    📊
                </div>
                <h4 className="text-slate-800 font-semibold italic">ไม่พบข้อมูลการจองที่เสร็จสิ้น</h4>
                <p className="text-slate-500 text-xs mt-1 max-w-[200px]">
                    ยังไม่มีบันทึกข้อมูลการเข้าพบที่เสร็จสิ้นในช่วงเวลาที่เลือก
                </p>
            </div>
        );
    }

    // Dynamic height based on number of items
    const chartHeight = Math.max(400, sortedData.length * 45);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        อันดับคณะตามยอดการปรึกษาจริง
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        เปรียบเทียบตามจำนวนเคสที่สถานะ "จองเสร็จสิ้น" (COMPLETED)
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
                            width={140}
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
                                        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl">
                                            <p className="text-xs font-bold text-slate-800 mb-1">{item.groupName}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <p className="text-xs text-slate-600">
                                                    สำเร็จแล้ว: <span className="font-bold text-slate-900">{item.completedCount}</span> เคส
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="completedCount"
                            radius={[0, 10, 10, 0]}
                            barSize={24}
                            className="cursor-pointer"
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === 0 ? "#10b981" : "#10b981"} // Keeping it solid for now
                                    fillOpacity={0.8 - (index / sortedData.length) * 0.5}
                                />
                            ))}
                            <LabelList
                                dataKey="completedCount"
                                position="right"
                                style={{ fill: "#475569", fontSize: 13, fontWeight: 700 }}
                                formatter={(val: any) => `${Number(val).toLocaleString()} เคส`}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl">
                <span className="flex items-center gap-1">
                    💡 คลิกที่กราฟเพื่อดูรายละเอียดรายสาขาวิชาของคณะนั้นๆ
                </span>
                <span className="font-mono opacity-60">SOURCE: COMPLETED_STATUS_ONLY</span>
            </div>
        </div>
    );
}
