// src/features/dashboard/dean/components/sections/DepartmentConsultationChart.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";

const COLORS = [
    "#6366f1", "#8b5cf6", "#a78bfa", "#c084fc",
    "#e879f9", "#f472b6", "#fb7185", "#f97316",
    "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

interface DeptBooking {
    id: number;
    nameTh: string;
    code: string;
    count: number;
}

const API = "/api/v2/dashboards/dean/story";

export default function DepartmentConsultationChart() {
    const router = useRouter();
    const [data, setData] = useState<DeptBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=departments&all_time=true`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.departmentBookings) {
                    setData(json.data.departmentBookings);
                }
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        })();
    }, []);

    const sorted = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);
    const maxCount = Math.max(...sorted.map(d => d.count), 1);

    const handleClick = (entry: DeptBooking) => {
        // Navigate to dean's own subject-group page (same role)
        router.push(`/dean/subject-group?dept=${entry.id}`);
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: "100ms" }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center shadow-lg shadow-indigo-200">
                    <Building2 className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">จำนวนครั้งปรึกษาจิตแพทย์ แยกตามสาขา</h2>
                    <p className="text-[11px] text-slate-400">กดที่แท่งเพื่อเจาะดูรายละเอียดของสาขานั้น</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                    <span className="ml-2 text-sm text-slate-400">กำลังโหลด...</span>
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm text-slate-300">
                    ยังไม่มีข้อมูล
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={Math.max(sorted.length * 48, 200)}>
                    <BarChart
                        data={sorted}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            domain={[0, Math.ceil(maxCount * 1.15)]}
                        />
                        <YAxis
                            type="category"
                            dataKey="nameTh"
                            width={160}
                            tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload as DeptBooking;
                                return (
                                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                                        <p className="font-bold text-slate-700">{d.nameTh}</p>
                                        <p className="text-slate-500 mt-0.5">
                                            ปรึกษา <span className="font-bold text-indigo-600">{d.count}</span> ครั้ง
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">คลิกเพื่อดูรายละเอียด</p>
                                    </div>
                                );
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[0, 8, 8, 0]}
                            cursor="pointer"
                            onClick={(_: any, idx: number) => handleClick(sorted[idx])}
                        >
                            {sorted.map((_, idx) => (
                                <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                    className="transition-opacity hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
