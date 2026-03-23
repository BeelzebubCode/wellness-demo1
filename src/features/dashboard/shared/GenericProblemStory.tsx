// src/features/dashboard/shared/GenericProblemStory.tsx
"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import { useStoryData, type DatePreset, type DateRange, type UnitMode } from "./story-utils";

// ─── Colors for each problem category (14 distinct colors) ───────────────────
const BAR_COLORS = [
    "#ef4444", // 1  red
    "#f59e0b", // 2  amber
    "#f97316", // 3  orange
    "#10b981", // 4  emerald
    "#06b6d4", // 5  cyan
    "#3b82f6", // 6  blue
    "#8b5cf6", // 7  violet
    "#ec4899", // 8  pink
    "#14b8a6", // 9  teal
    "#eab308", // 10 yellow
    "#d946ef", // 11 fuchsia
    "#6366f1", // 12 indigo
    "#64748b", // 13 slate
    "#a3a3a3", // 14 neutral
];


interface Props { apiPath: string; title: string; delay?: number; description?: string; }

export default function GenericProblemStory({ apiPath, title, delay = 0, description }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [deptIds, setDeptIds] = useState<string[]>([]);
    const [chronicConditions, setChronicConditions] = useState<{ id: number; nameTh: string }[]>([]);

    useEffect(() => {
        fetch('/api/v2/analytics/chronic-conditions', { credentials: 'include' })
            .then(r => r.json())
            .then(j => setChronicConditions(j.data ?? []))
            .catch(() => { });
    }, []);

    const { data, loading, meta } = useStoryData<any>(apiPath, "problems", {
        department_ids: deptIds,
    }, date, customRange);

    const categories = data?.categories ?? [];
    const totalProblems = categories.reduce((s: number, c: any) => s + c.count, 0);

    // ✅ Show ALL categories (no slice), sorted by count desc
    const barData = [...categories]
        .sort((a: any, b: any) => b.count - a.count)
        .map((c: any) => ({
            name: c.label,
            fullName: c.label,
            count: c.count,
            pct: totalProblems > 0 ? parseFloat((c.count / totalProblems * 100).toFixed(1)) : 0,
        }));

    // Dynamic height: 36px per bar, min 200px
    const chartHeight = Math.max(200, barData.length * 36 + 40);

    return (
        <DataStoryCard
            icon={<AlertTriangle className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
            title={title}
            description={description}
            narration={
                data
                    ? `พบปัญหา ${totalProblems.toLocaleString()} กรณี จาก ${categories.length} ประเภท — ปัญหาอันดับ 1: ${categories[0]?.label ?? "ไม่มีข้อมูล"}`
                    : "กำลังโหลด..."
            }
            kpis={data ? [
                { label: "กรณีทั้งหมด", value: totalProblems, color: "#f59e0b" },
                { label: "ประเภท", value: categories.length, color: "#4f46e5" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <div className="flex items-center justify-between gap-3">
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={meta?.dataRange} />
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    {meta?.departments?.length > 0 && (
                        <StoryChipGroup
                            label="ภาควิชา"
                            options={meta.departments.map((d: any) => ({ value: String(d.id), label: d.nameTh }))}
                            selected={deptIds}
                            onChange={setDeptIds}
                        />
                    )}
                </StoryFilterStack>
            }
            datePreset={date}
            dataRange={meta?.dataRange}
            customRange={customRange}
            delay={delay}
            loading={loading}
        >
            {data && (
                <div className="space-y-4">
                    {/* Problem categories bar chart */}
                    {barData.length > 0 && (
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">ประเภทปัญหา</p>
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }}
                                        tickFormatter={(v: number) => unit === "percent" ? `${v}%` : v.toLocaleString()} />
                                    <YAxis type="category" dataKey="name" width={140}
                                        tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }} />
                                    <Tooltip content={<ProblemTip unit={unit} />} />
                                    <Bar dataKey={unit === "percent" ? "pct" : "count"} name="จำนวน" radius={[0, 6, 6, 0]} barSize={20}>
                                        {barData.map((_: any, idx: number) => (
                                            <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                </div>
            )}
        </DataStoryCard>
    );
}

// ─── Enhanced Tooltip for problem bars ────────────────────────────────────────
function ProblemTip({ active, payload, label, unit }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
        <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10">
            <p className="font-bold text-white/90 mb-1">{d?.fullName ?? label}</p>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0]?.color }} />
                <span className="text-white/50">จำนวน:</span>
                <span className="font-bold text-white">{d?.count?.toLocaleString()}</span>
            </div>
            {d?.pct != null && (
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-2 h-2 rounded-full opacity-0" />
                    <span className="text-white/50">สัดส่วน:</span>
                    <span className="font-bold text-white">{d.pct}%</span>
                </div>
            )}
        </div>
    );
}
