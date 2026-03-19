"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Loader2 } from "lucide-react";

const API = "/api/v2/dashboards/rector/story";
const DONUT_COLORS = ["#6366f1", "#f97316"];

export default function StaffUtilizationDonut() {
    const [data, setData] = useState<{ internal: number; borrowed: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ story: "departments", all_time: "true" });
                const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (!cancelled) setData(json.data?.staffUtilization ?? null);
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const total = (data?.internal ?? 0) + (data?.borrowed ?? 0);
    const chartData = [
        { name: "บุคลากรภายใน", value: data?.internal ?? 0 },
        { name: "ยืมตัว", value: data?.borrowed ?? 0 },
    ];
    const pctInternal = total > 0 ? Math.round(((data?.internal ?? 0) / total) * 100) : 0;
    const pctBorrowed = total > 0 ? Math.round(((data?.borrowed ?? 0) / total) * 100) : 0;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 grid place-items-center shadow-lg shadow-orange-200">
                    <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">การใช้บุคลากรจิตแพทย์</h2>
                    <p className="text-xs text-slate-400">บุคลากรภายใน vs ยืมตัว (All time)</p>
                </div>
            </div>

            {pctBorrowed > 30 && !loading && (
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-600">
                    ⚠ ยืมตัวสูง {pctBorrowed}% — แนะนำเพิ่มบุคลากรภายใน
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                </div>
            ) : total === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-300 border border-dashed rounded-xl">
                    <Users className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">ยังไม่มีข้อมูล</p>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <div className="relative w-[140px] h-[140px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} strokeWidth={0}>
                                    {chartData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                                </Pie>
                                <Tooltip content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                                            <p className="font-bold text-slate-800">{payload[0].name}</p>
                                            <p className="text-slate-500">{(payload[0].value as number).toLocaleString()} งาน</p>
                                        </div>
                                    );
                                }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-black text-slate-800">{total.toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">เคสรวม</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        {[
                            { label: "บุคลากรภายใน", pct: pctInternal, count: data?.internal ?? 0, color: DONUT_COLORS[0] },
                            { label: "ยืมตัว", pct: pctBorrowed, count: data?.borrowed ?? 0, color: DONUT_COLORS[1] },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                        <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-800">{item.pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">{item.count.toLocaleString()} ครั้ง</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
