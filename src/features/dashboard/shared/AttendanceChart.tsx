// src/features/dashboard/shared/AttendanceChart.tsx
"use client";

import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { AttendanceGroupItem } from "./analytics-types";
import { ChartCard } from "./ChartCard";

const COLORS = {
    checkedIn: "#22c55e",
    late: "#f59e0b",
    noShow: "#ef4444",
};

export function AttendanceChart({
    data,
    loading,
    onBarClick,
}: {
    data: AttendanceGroupItem[];
    loading?: boolean;
    onBarClick?: (item: AttendanceGroupItem) => void;
}) {
    const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 15);

    return (
        <ChartCard
            title="สถิติการเข้าพบ (Attendance)"
            subtitle="CHECKED_IN / LATE / NO_SHOW ตามกลุ่ม"
            loading={loading}
            isEmpty={sorted.length === 0}
        >
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sorted} margin={{ left: 10, right: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="groupName"
                        tick={{ fontSize: 10 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        formatter={(value: any, name: any, props: any) => {
                            const item = props.payload as AttendanceGroupItem;
                            const rateMap: Record<string, number> = {
                                checkedIn: item.checkedInRate,
                                late: item.lateRate,
                                noShow: item.noShowRate,
                            };
                            const rate = rateMap[name] ?? 0;
                            const labelMap: Record<string, string> = {
                                checkedIn: "เข้าพบ",
                                late: "สาย",
                                noShow: "ไม่มา",
                            };
                            return [`${value} (${(rate * 100).toFixed(1)}%)`, labelMap[name] || name];
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value: string) => {
                            const m: Record<string, string> = { checkedIn: "เข้าพบตรงเวลา", late: "มาสาย", noShow: "ไม่มาตามนัด" };
                            return m[value] || value;
                        }}
                    />
                    <Bar
                        dataKey="checkedIn"
                        stackId="a"
                        fill={COLORS.checkedIn}
                        radius={[0, 0, 0, 0]}
                        cursor={onBarClick ? "pointer" : "default"}
                        onClick={(_, index) => onBarClick?.(sorted[index])}
                    />
                    <Bar dataKey="late" stackId="a" fill={COLORS.late} />
                    <Bar dataKey="noShow" stackId="a" fill={COLORS.noShow} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
