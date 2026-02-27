// src/features/dashboard/shared/TrendChart.tsx
"use client";

import React from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { TrendBucket } from "../types/analytics-types";
import { ChartCard } from "../cards/ChartCard";

function formatBucket(bucket: string): string {
    if (!bucket) return "";
    // "2026-01-15" → "15 ม.ค."
    const d = new Date(bucket);
    if (isNaN(d.getTime())) return bucket;
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function TrendChart({
    data,
    loading,
}: {
    data: TrendBucket[];
    loading?: boolean;
}) {
    const chartData = data.map((d) => ({
        ...d,
        label: formatBucket(d.bucket),
    }));

    return (
        <ChartCard
            title="แนวโน้มตามเวลา"
            subtitle="Bookings, Cancellations, No-Shows, Risk"
            loading={loading}
            isEmpty={chartData.length === 0}
        >
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                    <defs>
                        <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCancel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradNoShow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        formatter={(value: any, name: any) => {
                            const labelMap: Record<string, string> = {
                                totalBookings: "การจอง",
                                cancelledCount: "ยกเลิก",
                                noShowCount: "ไม่มาตามนัด",
                            };
                            return [value, labelMap[name] || name];
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value: string) => {
                            const m: Record<string, string> = {
                                totalBookings: "การจองทั้งหมด",
                                cancelledCount: "ยกเลิก",
                                noShowCount: "ไม่มาตามนัด",
                            };
                            return m[value] || value;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="totalBookings"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#gradBookings)"
                    />
                    <Area
                        type="monotone"
                        dataKey="cancelledCount"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#gradCancel)"
                    />
                    <Area
                        type="monotone"
                        dataKey="noShowCount"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#gradNoShow)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
