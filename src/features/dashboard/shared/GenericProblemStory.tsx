// src/features/dashboard/shared/GenericProblemStory.tsx
"use client";

import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import { useStoryData, Tip, PIE_COLORS, INCOME_LABEL, type DatePreset, type DateRange, type UnitMode } from "./story-utils";

interface Props { apiPath: string; title: string; delay?: number; }

export default function GenericProblemStory({ apiPath, title, delay = 0 }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [income, setIncome] = useState<string[]>([]);
    const [blood, setBlood] = useState<string[]>([]);
    const [parental, setParental] = useState<string[]>([]);

    const { data, loading } = useStoryData<any>(apiPath, "problems", {
        family_income_bracket: income,
        blood_group: blood,
        parental_status: parental,
    }, date, customRange);

    const categories = data?.categories ?? [];
    const totalProblems = categories.reduce((s: number, c: any) => s + c.count, 0);

    const barData = categories.slice(0, 8).map((c: any) => ({
        name: c.label?.length > 15 ? c.label.substring(0, 15) + "..." : c.label,
        fullName: c.label,
        count: c.count,
    }));

    return (
        <DataStoryCard
            icon={<AlertTriangle className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
            title={title}
            narration={
                data
                    ? `พบปัญหา ${totalProblems} กรณี จาก ${categories.length} ประเภท — ปัญหาอันดับ 1: ${categories[0]?.label ?? "ไม่มีข้อมูล"}`
                    : "กำลังโหลด..."
            }
            kpis={data ? [
                { label: "กรณีทั้งหมด", value: totalProblems, color: "#f59e0b" },
                { label: "ประเภท", value: categories.length, color: "#4f46e5" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <div className="flex items-center justify-between gap-3">
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    <StoryChipGroup label="รายได้" options={[
                        { value: "UNDER_100K", label: "< 100K" },
                        { value: "BETWEEN_100K_200K", label: "100-200K" },
                        { value: "BETWEEN_200K_300K", label: "200-300K" },
                        { value: "BETWEEN_300K_500K", label: "300-500K" },
                        { value: "OVER_1M", label: "> 1M" },
                    ]} selected={income} onChange={setIncome} />
                    <StoryChipGroup label="กรุ๊ปเลือด" options={[
                        { value: "A", label: "A" }, { value: "B", label: "B" },
                        { value: "O", label: "O" }, { value: "AB", label: "AB" },
                    ]} selected={blood} onChange={setBlood} />
                    <StoryChipGroup label="สถานะบิดามารดา" options={[
                        { value: "TOGETHER", label: "อยู่ด้วยกัน" },
                        { value: "SEPARATED", label: "แยกกัน" },
                        { value: "DIVORCED", label: "หย่าร้าง" },
                        { value: "DECEASED", label: "เสียชีวิต" },
                    ]} selected={parental} onChange={setParental} />
                </StoryFilterStack>
            }
            delay={delay}
            loading={loading}
        >
            {data && (
                <div className="space-y-4">
                    {/* Problem categories bar chart */}
                    {barData.length > 0 && (
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">ประเภทปัญหา</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                    <YAxis type="category" dataKey="name" width={120}
                                        tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <Tooltip content={<Tip />} />
                                    <Bar dataKey="count" name="จำนวน" radius={[0, 6, 6, 0]}
                                        fill="#f59e0b" barSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Income + Parental distribution side by side */}
                    <div className="grid grid-cols-2 gap-4">
                        {data.incomeDist?.length > 0 && (
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">กลุ่มรายได้ครอบครัว</p>
                                {data.incomeDist.map((d: any, i: number) => {
                                    const pct = totalProblems > 0 ? Math.round(d.count / totalProblems * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-2 mb-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-[11px] text-slate-600 flex-1">{INCOME_LABEL[d.label] ?? d.label}</span>
                                            <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                                                {unit === "count" ? d.count : `${pct}%`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {data.parentalDist?.length > 0 && (
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">สถานะบิดามารดา</p>
                                {data.parentalDist.map((d: any, i: number) => {
                                    const pct = totalProblems > 0 ? Math.round(d.count / totalProblems * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-2 mb-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-[11px] text-slate-600 flex-1">{d.label}</span>
                                            <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                                                {unit === "count" ? d.count : `${pct}%`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DataStoryCard>
    );
}
