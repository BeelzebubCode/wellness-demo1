// src/features/dashboard/rector/components/sections/StaffUtilizationDonut.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Users, Loader2 } from "lucide-react";

const API = "/api/v2/dashboards/rector/story";

const DONUT_COLORS = ["#6366f1", "#f97316"];

export default function StaffUtilizationDonut() {
    const [data, setData] = useState<{ internal: number; borrowed: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=departments&all_time=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.staffUtilization) setData(json.data.staffUtilization);
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        })();
    }, []);

    const total = (data?.internal ?? 0) + (data?.borrowed ?? 0);
    const chartData = [
        { name: "บุคลากรภายใน", value: data?.internal ?? 0 },
        { name: "ยืมตัว", value: data?.borrowed ?? 0 },
    ];

    const pctInternal = total > 0 ? Math.round(((data?.internal ?? 0) / total) * 100) : 0;
    const pctBorrowed = total > 0 ? Math.round(((data?.borrowed ?? 0) / total) * 100) : 0;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 grid place-items-center shadow-lg shadow-orange-200">
                    <Users className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">การใช้บุคลากรจิตแพทย์</h2>
                    <p className="text-[11px] text-slate-400">สัดส่วนการมอบหมายงาน: ภายใน vs ยืมตัว</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                </div>
            ) : total === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-300">
                    ยังไม่มีข้อมูลการมอบหมาย
                </div>
            ) : (
                <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={3}
                                strokeWidth={2}
                            >
                                {chartData.map((_, idx) => (
                                    <Cell key={idx} fill={DONUT_COLORS[idx]} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                                            <p className="font-bold text-slate-700">{payload[0].name}</p>
                                            <p className="text-slate-500">{payload[0].value} ครั้ง</p>
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full" style={{ background: DONUT_COLORS[0] }} />
                            <div>
                                <p className="text-sm font-bold text-slate-700">บุคลากรภายใน</p>
                                <p className="text-xs text-slate-400">
                                    {data?.internal ?? 0} ครั้ง ({pctInternal}%)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full" style={{ background: DONUT_COLORS[1] }} />
                            <div>
                                <p className="text-sm font-bold text-slate-700">ยืมตัว</p>
                                <p className="text-xs text-slate-400">
                                    {data?.borrowed ?? 0} ครั้ง ({pctBorrowed}%)
                                </p>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                รวมทั้งหมด <span className="font-bold text-slate-600">{total}</span> ครั้ง
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
