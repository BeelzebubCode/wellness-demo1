"use client";

import React, { useState, useEffect } from "react";
import { getTopUniversities } from "../actions";
import { ChartCard } from "../../widgets/cards/ChartCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

type Preset = "7d" | "30d" | "90d" | "all";

export function SuperAdminTopUniversitiesChart() {
    const [data, setData] = useState<Awaited<ReturnType<typeof getTopUniversities>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState<Preset>("all");
    const [mode, setMode] = useState<"requesting" | "lending">("requesting");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getTopUniversities(preset);
                if (!cancelled) setData(res);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [preset]);

    const displayData = data ? (mode === "requesting" ? data.topRequesting : data.topLending) : [];

    // Sort ascending for horizontal bar chart
    const chartData = [...displayData].reverse();

    return (
        <ChartCard
            title="มหาวิทยาลัยที่มีบทบาทสูงสุด"
            subtitle={mode === "requesting" ? "10 อันดับมหาวิทยาลัยที่ส่งคำขอยืมตัวเยอะที่สุด" : "10 อันดับมหาวิทยาลัยที่ส่งที่ปรึกษาไปช่วยมากที่สุด"}
            loading={loading}
            isEmpty={!chartData || chartData.length === 0}
            action={
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                        <button
                            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${mode === "requesting" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                            onClick={() => setMode("requesting")}
                        >
                            ผู้ขอยืม
                        </button>
                        <button
                            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${mode === "lending" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
                            onClick={() => setMode("lending")}
                        >
                            ผู้ให้ยืม
                        </button>
                    </div>
                    <select
                        className="text-xs bg-slate-50 border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600 font-medium"
                        value={preset}
                        onChange={(e) => setPreset(e.target.value as Preset)}
                    >
                        <option value="7d">7 วัน</option>
                        <option value="30d">30 วัน</option>
                        <option value="90d">90 วัน</option>
                        <option value="all">ทั้งหมด</option>
                    </select>
                </div>
            }
        >
            <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="universityName"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            width={120}
                        />
                        <Tooltip
                            cursor={{ fill: "#f8fafc" }}
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                        />
                        <Bar
                            dataKey="count"
                            name="จำนวน (ครั้ง)"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={mode === "requesting" ? "#818cf8" : "#10b981"} />
                            ))}
                            <LabelList dataKey="count" position="right" fill="#64748b" fontSize={11} fontWeight="bold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
