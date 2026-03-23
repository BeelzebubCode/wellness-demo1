// src/features/dashboard/shared/GenericRiskStory.tsx
"use client";

import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ShieldAlert } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { DatePresetBar } from "./StoryUI";
import { useStoryData, Tip, RISK_META, type DatePreset, type DateRange } from "./story-utils";

interface Props { apiPath: string; title: string; delay?: number; description?: string; }

export default function GenericRiskStory({ apiPath, title, delay = 0, description }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [deptIds, setDeptIds] = useState<string[]>([]);

    interface RiskDistItem { label: string; count: number }
    const DEFAULT_META = { label: "ไม่ระบุ", color: "#94a3b8", bg: "bg-slate-50" };

    const { data, loading, meta } = useStoryData<{
        distribution: RiskDistItem[];
        highRiskCount: number;
    }>(apiPath, "risk", {
        department_ids: deptIds,
    }, date, customRange);

    const distribution = data?.distribution ?? [];
    const total = distribution.reduce((s, d) => s + d.count, 0);
    const highRisk = data?.highRiskCount ?? 0;
    const highPct = total > 0 ? Math.round(highRisk / total * 100) : 0;

    const pieData = useMemo(() => distribution.map((d) => {
        const m = RISK_META[d.label] ?? DEFAULT_META;
        return { name: m.label, value: d.count, color: m.color };
    }), [distribution]);

    return (
        <DataStoryCard
            icon={<ShieldAlert className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-rose-500 to-pink-600"
            title={title}
            description={description}
            narration={
                data
                    ? `ประเมินความเสี่ยงทั้งหมด ${total} ครั้ง — ระดับสูง/วิกฤต ${highRisk} ครั้ง (${highPct}%)`
                    : "กำลังโหลด..."
            }
            kpis={data ? [
                { label: "ประเมินรวม", value: total, color: "#4f46e5" },
                { label: "สูง/วิกฤต", value: highRisk, color: "#f43f5e" },
                { label: "อัตราสูง", value: `${highPct}%`, color: "#f59e0b" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={meta?.dataRange} />
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
                <div className="flex items-center gap-6">
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name"
                                    cx="50%" cy="50%" outerRadius={80} innerRadius={50}
                                    paddingAngle={3} strokeWidth={0}>
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<Tip />} />
                                <Legend verticalAlign="bottom" iconType="circle"
                                    formatter={(v: string) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-44 shrink-0 space-y-2">
                        {distribution.map((d, i) => {
                            const rm = RISK_META[d.label] ?? DEFAULT_META;
                            const pct = total > 0 ? Math.round(d.count / total * 100) : 0;
                            return (
                                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${rm.bg}`}>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rm.color }} />
                                    <span className="text-[11px] text-slate-600 flex-1">{rm.label}</span>
                                    <span className="text-[12px] font-bold text-slate-700 tabular-nums">
                                        {d.count}
                                    </span>
                                    <span className="text-[10px] text-slate-400 tabular-nums">({pct}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </DataStoryCard>
    );
}
