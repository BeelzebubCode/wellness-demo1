// src/features/dashboard/shared/GenericStudentStory.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Generic student overview story card — reused by all roles
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import { useStoryData, Tip, PIE_COLORS, type DatePreset, type DateRange, type UnitMode } from "./story-utils";

interface Props {
    apiPath: string;
    title: string;
    delay?: number;
    description?: string;
}

export default function GenericStudentStory({ apiPath, title, delay = 0, description }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [gender, setGender] = useState<string[]>([]);
    const { data, loading } = useStoryData<any>(apiPath, "students", { gender }, date, customRange);

    const total = data?.totalStudents ?? 0;
    const consulted = data?.consultedCount ?? 0;
    const never = data?.neverConsultedCount ?? 0;
    const pctConsulted = total > 0 ? Math.round(consulted / total * 100) : 0;
    const pctNever = total > 0 ? 100 - pctConsulted : 0;

    const pieData = [
        { name: "เคยมาปรึกษา", value: consulted },
        { name: "ไม่เคยมาปรึกษา", value: never },
    ];

    return (
        <DataStoryCard
            icon={<Users className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-indigo-500 to-blue-600"
            title={title}
            description={description}
            narration={
                data ? `นิสิตทั้งหมด ${total} คน — เคยมาปรึกษา ${consulted} คน (${pctConsulted}%) / ไม่เคย ${never} คน (${pctNever}%)`
                    : "กำลังโหลด..."
            }
            kpis={data ? [
                { label: "นิสิตรวม", value: total, color: "#4f46e5" },
                { label: "เคยมา", value: unit === "count" ? consulted : `${pctConsulted}%`, color: "#10b981" },
                { label: "ไม่เคยมา", value: unit === "count" ? never : `${pctNever}%`, color: "#f43f5e" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <div className="flex items-center justify-between gap-3">
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    <StoryChipGroup label="เพศ" options={[
                        { value: "MALE", label: "ชาย" },
                        { value: "FEMALE", label: "หญิง" },
                        { value: "LGBTQ_PLUS", label: "LGBTQ+" },
                    ]} selected={gender} onChange={setGender} />
                </StoryFilterStack>
            }
            delay={delay}
            loading={loading}
        >
            {data && (
                <div className="flex items-center gap-6">
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name"
                                    cx="50%" cy="50%" outerRadius={75} innerRadius={45}
                                    paddingAngle={4} strokeWidth={0}>
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f1f5f9" />
                                </Pie>
                                <Tooltip content={<Tip />} />
                                <Legend verticalAlign="bottom" iconType="circle"
                                    formatter={(v: string) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {data.bloodDist?.length > 0 && (
                        <div className="w-40 shrink-0">
                            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">กรุ๊ปเลือด</p>
                            {data.bloodDist.map((b: any, i: number) => {
                                const pct = total > 0 ? Math.round(b.count / total * 100) : 0;
                                return (
                                    <div key={i} className="flex items-center gap-2 mb-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <span className="text-[11px] text-slate-600 flex-1">{b.label}</span>
                                        <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                                            {unit === "count" ? b.count : `${pct}%`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </DataStoryCard>
    );
}
