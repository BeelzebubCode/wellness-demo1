// src/features/dashboard/shared/RiskDistributionChart.tsx
"use client";

import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { RiskDistribution } from "./analytics-types";
import { ChartCard } from "./ChartCard";
import { AlertTriangle, TrendingUp, Shield } from "lucide-react";

const RISK_COLORS: Record<number, string> = {
    1: "#22c55e",
    2: "#84cc16",
    3: "#f59e0b",
    4: "#f97316",
    5: "#ef4444",
};

const RISK_LABELS: Record<number, string> = {
    1: "ปกติ",
    2: "เฝ้าระวัง",
    3: "ปานกลาง",
    4: "เสี่ยงสูง",
    5: "วิกฤต",
};

export function RiskDistributionChart({
    data,
    loading,
}: {
    data: RiskDistribution | null;
    loading?: boolean;
}) {
    const isEmpty = !data || data.totalWithRisk === 0;

    const chartData = (data?.levels || []).map((l) => ({
        name: `ระดับ ${l.level}`,
        label: RISK_LABELS[l.level] || `Level ${l.level}`,
        count: l.count,
        rate: l.rate,
        level: l.level,
    }));

    return (
        <ChartCard
            title="การกระจายระดับความเสี่ยง"
            subtitle="Risk Level 1-5"
            loading={loading}
            isEmpty={isEmpty}
        >
            <div className="w-full space-y-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">AVG Risk</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                            {data?.avgRisk?.toFixed(1) ?? "—"}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-3 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">High Risk</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                            {data ? `${(data.highRiskRate * 100).toFixed(1)}%` : "—"}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-3 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Total</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                            {data?.totalWithRisk?.toLocaleString() ?? "—"}
                        </p>
                    </div>
                </div>

                {/* Bar chart */}
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: 12, fontSize: 12 }}
                            formatter={(value: any, _: any, props: any) => {
                                const rate = props.payload.rate as number;
                                return [`${value} (${(rate * 100).toFixed(1)}%)`, "จำนวน"];
                            }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry) => (
                                <Cell key={entry.level} fill={RISK_COLORS[entry.level] || "#94a3b8"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
