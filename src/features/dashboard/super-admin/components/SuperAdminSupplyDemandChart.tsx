// SuperAdminSupplyDemandChart.tsx
"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "../../widgets/cards/ChartCard";
import { getSupplyDemandGap } from "../actions";

type GapItem = { category: string; demand: number; supply: number; gap: number };

export function SuperAdminSupplyDemandChart() {
    const [data, setData] = useState<GapItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSupplyDemandGap()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    return (
        <ChartCard
            title="Supply vs Demand Gap"
            subtitle="เปรียบเทียบประเภทปัญหาที่นิสิตต้องการ vs ความเชี่ยวชาญที่ปรึกษาในระบบ (90 วัน)"
            loading={loading}
            isEmpty={data.length === 0}
        >
            <ResponsiveContainer width="100%" height={Math.max(280, data.length * 40)}>
                <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis
                        dataKey="category"
                        type="category"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        width={140}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={((value: any, name: string) => [
                            String(value ?? 0),
                            name === "demand" ? "Demand (คำขอ)" : "Supply (ที่ปรึกษา)"
                        ]) as any}
                    />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        formatter={(value: string) => value === "demand" ? "Demand (คำขอนิสิต)" : "Supply (ที่ปรึกษา)"}
                    />
                    <Bar dataKey="demand" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={14} />
                    <Bar dataKey="supply" fill="#34d399" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
