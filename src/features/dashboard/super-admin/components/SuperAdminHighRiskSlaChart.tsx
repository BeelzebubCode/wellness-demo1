// SuperAdminHighRiskSlaChart.tsx
"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartCard } from "../../widgets/cards/ChartCard";
import { getHighRiskResponseTime } from "../actions";

type SlaItem = { universityName: string; avgWaitHours: number; caseCount: number };

export function SuperAdminHighRiskSlaChart() {
    const [data, setData] = useState<SlaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHighRiskResponseTime()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const getColor = (hours: number) => {
        if (hours <= 24) return "#22c55e"; // green — within 24h
        if (hours <= 48) return "#f59e0b"; // amber — 24-48h
        return "#ef4444"; // red — over 48h
    };

    return (
        <ChartCard
            title="Emergency Response SLA"
            subtitle="ระยะเวลารอคอยเฉลี่ย (ชั่วโมง) ของเคส High Risk แยกตามมหาวิทยาลัย"
            loading={loading}
            isEmpty={data.length === 0}
        >
            <div className="w-full">
                {/* SLA Legend */}
                <div className="flex items-center gap-4 mb-4 text-[11px] font-semibold">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> ≤ 24 ชม.</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 24–48 ชม.</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> &gt; 48 ชม.</span>
                </div>

                <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36)}>
                    <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            label={{ value: "ชั่วโมง", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "#94a3b8" }}
                        />
                        <YAxis
                            dataKey="universityName"
                            type="category"
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            width={160}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                            formatter={((value: any, _name: any, props: any) => [
                                `${value ?? 0} ชั่วโมง (${props?.payload?.caseCount ?? 0} เคส)`,
                                "เวลารอเฉลี่ย"
                            ]) as any}
                        />
                        <Bar dataKey="avgWaitHours" radius={[0, 8, 8, 0]} barSize={16}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={getColor(entry.avgWaitHours)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
