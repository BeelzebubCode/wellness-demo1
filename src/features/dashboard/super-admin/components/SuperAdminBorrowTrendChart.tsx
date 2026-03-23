"use client";

import React, { useState, useEffect } from "react";
import { getBorrowTrend } from "../actions";
import { ChartCard } from "../../widgets/cards/ChartCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Preset = "7d" | "30d" | "90d" | "all";

export function SuperAdminBorrowTrendChart() {
    const [data, setData] = useState<Awaited<ReturnType<typeof getBorrowTrend>>>([]);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState<Preset>("30d");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getBorrowTrend(preset);
                if (!cancelled) setData(res);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [preset]);

    const formatXAxis = (tickItem: string) => {
        try {
            return format(new Date(tickItem), "d MMM", { locale: th });
        } catch {
            return tickItem;
        }
    };

    return (
        <ChartCard
            title="แนวโน้มคำขอยืมตัวที่ปรึกษา"
            subtitle="ปริมาณคำขอที่ถูกสร้างขึ้นในแต่ละวัน (คำขอใหม่ vs อนุมัติสำเร็จ)"
            loading={loading}
            isEmpty={data.length === 0}
            action={
                <select
                    className="text-xs bg-slate-50 border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-medium"
                    value={preset}
                    onChange={(e) => setPreset(e.target.value as Preset)}
                >
                    <option value="7d">7 วันล่าสุด</option>
                    <option value="30d">30 วันล่าสุด</option>
                    <option value="90d">90 วันล่าสุด</option>
                    <option value="all">ทั้งหมด</option>
                </select>
            }
        >
            <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="bucket"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            tickFormatter={formatXAxis}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                        />
                        <RechartsTooltip
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                            labelStyle={{ fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                        <Area
                            type="monotone"
                            name="รวมคำขอ"
                            dataKey="total"
                            stroke="#818cf8"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                        <Area
                            type="monotone"
                            name="ผ่านการอนุมัติ"
                            dataKey="approved"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorApproved)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
