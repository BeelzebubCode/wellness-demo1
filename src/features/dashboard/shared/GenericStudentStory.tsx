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
    const { data, loading, meta } = useStoryData<any>(apiPath, "students", { gender }, date, customRange);

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
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={meta?.dataRange} />
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    <StoryChipGroup label="เพศ" options={[
                        { value: "MALE", label: "ชาย" },
                        { value: "FEMALE", label: "หญิง" },
                        { value: "LGBTQ_PLUS", label: "LGBTQ+" },
                    ]} selected={gender} onChange={setGender} />
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
                    <div className="flex-1 min-w-0">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name"
                                    cx="50%" cy="50%" outerRadius={80} innerRadius={50}
                                    paddingAngle={4} strokeWidth={0}>
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f1f5f9" />
                                </Pie>
                                <Tooltip content={<Tip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-48 shrink-0 space-y-1.5">
                        {pieData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? "#10b981" : "#e2e8f0" }} />
                                <span className="text-[11px] flex-1 font-medium text-slate-600 truncate">{d.name}</span>
                                <span className="text-[12px] font-bold text-slate-700 tabular-nums">{d.value.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 tabular-nums">({i === 0 ? pctConsulted : pctNever}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </DataStoryCard>
    );
}
