// src/features/dashboard/rector/components/sections/RectorRiskSection.tsx
// Rector-specific risk story — injects global filters
"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ShieldAlert } from "lucide-react";
import { DataStoryCard } from "@/features/dashboard/widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "@/features/dashboard/widgets/story/StoryFilterChips";
import { DatePresetBar } from "@/features/dashboard/shared/StoryUI";
import { useStoryData, Tip, RISK_META, type DatePreset, type DateRange } from "@/features/dashboard/shared/story-utils";
import { RectorDashboardFilters } from "@/features/dashboard/rector/types";

interface Props {
    apiPath: string;
    title: string;
    delay?: number;
    globalFilters?: RectorDashboardFilters;
}

export default function RectorRiskSection({ apiPath, title, delay = 0, globalFilters = {} }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [gender, setGender] = useState<string[]>([]);
    const [income, setIncome] = useState<string[]>([]);
    const [parental, setParental] = useState<string[]>([]);
    const [blood, setBlood] = useState<string[]>([]);
    const [deptIds, setDeptIds] = useState<string[]>([]);

    const mergedFilters: Record<string, string[]> = {
        department_ids: [
            ...(globalFilters.departmentId ? [String(globalFilters.departmentId)] : []),
            ...deptIds,
        ],
        gender: [
            ...(globalFilters.gender ? [globalFilters.gender] : []),
            ...gender,
        ],
        family_income_bracket: income,
        parental_status: parental,
        blood_group: blood,
        ...(globalFilters.facultyId ? { faculty_ids: [String(globalFilters.facultyId)] } : {}),
        ...(globalFilters.problemCategoryId ? { problem_category_ids: [String(globalFilters.problemCategoryId)] } : {}),
    };

    const effectiveDate: DatePreset = globalFilters.startDate ? "custom" : date;
    const effectiveRange: DateRange | undefined = globalFilters.startDate
        ? {
            start: globalFilters.startDate.toISOString().split("T")[0],
            end: (globalFilters.endDate ?? new Date()).toISOString().split("T")[0],
        }
        : customRange;

    const { data, loading, meta } = useStoryData<any>(apiPath, "risk", mergedFilters, effectiveDate, effectiveRange);

    const distribution = data?.distribution ?? [];
    const total = distribution.reduce((s: number, d: any) => s + d.count, 0);
    const highRisk = data?.highRiskCount ?? 0;
    const highPct = total > 0 ? Math.round(highRisk / total * 100) : 0;

    const pieData = distribution.map((d: any) => {
        const m = RISK_META[d.label] ?? RISK_META.UNKNOWN;
        return { name: m.label, value: d.count, color: m.color };
    });

    return (
        <DataStoryCard
            icon={<ShieldAlert className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-rose-500 to-pink-600"
            title={title}
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
                    {!globalFilters.startDate
                        ? <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
                        : <span className="text-[11px] text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-lg">ใช้ช่วงวันจาก Global Filter</span>
                    }
                    {meta?.departments?.length > 0 && !globalFilters.departmentId && (
                        <StoryChipGroup
                            label="ภาควิชา"
                            options={meta.departments.map((d: any) => ({ value: String(d.id), label: d.nameTh }))}
                            selected={deptIds}
                            onChange={setDeptIds}
                        />
                    )}
                    {!globalFilters.gender && (
                        <StoryChipGroup label="เพศ" options={[
                            { value: "MALE", label: "ชาย" },
                            { value: "FEMALE", label: "หญิง" },
                            { value: "LGBTQ_PLUS", label: "LGBTQ+" },
                        ]} selected={gender} onChange={setGender} />
                    )}
                    <StoryChipGroup label="รายได้" options={[
                        { value: "UNDER_100K", label: "< 100K" }, { value: "BETWEEN_100K_200K", label: "100-200K" },
                        { value: "BETWEEN_200K_300K", label: "200-300K" }, { value: "BETWEEN_300K_500K", label: "300-500K" },
                        { value: "BETWEEN_500K_800K", label: "500-800K" }, { value: "OVER_1M", label: "> 1M" },
                    ]} selected={income} onChange={setIncome} />
                    <StoryChipGroup label="ครอบครัว" options={[
                        { value: "TOGETHER", label: "อยู่ด้วยกัน" }, { value: "DIVORCED", label: "หย่าร้าง" },
                        { value: "FATHER_DECEASED", label: "บิดาเสีย" }, { value: "MOTHER_DECEASED", label: "มารดาเสีย" },
                        { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" },
                    ]} selected={parental} onChange={setParental} />
                    <StoryChipGroup label="กรุ๊ปเลือด" options={[
                        { value: "A", label: "A" }, { value: "B", label: "B" },
                        { value: "AB", label: "AB" }, { value: "O", label: "O" },
                    ]} selected={blood} onChange={setBlood} />
                </StoryFilterStack>
            }
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
                                    {pieData.map((entry: any, i: number) => (
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
                        {distribution.map((d: any, i: number) => {
                            const m = RISK_META[d.label] ?? RISK_META.UNKNOWN;
                            const pct = total > 0 ? Math.round(d.count / total * 100) : 0;
                            return (
                                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${m.bg}`}>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                                    <span className="text-[11px] text-slate-600 flex-1">{m.label}</span>
                                    <span className="text-[12px] font-bold text-slate-700 tabular-nums">{d.count}</span>
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
