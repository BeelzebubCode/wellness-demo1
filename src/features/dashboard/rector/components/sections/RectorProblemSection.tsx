// src/features/dashboard/rector/components/sections/RectorProblemSection.tsx
// Rector-specific problem story — injects global filters
"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";
import { DataStoryCard } from "@/features/dashboard/widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "@/features/dashboard/widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "@/features/dashboard/shared/StoryUI";
import { useStoryData, PIE_COLORS, INCOME_LABEL, type DatePreset, type DateRange, type UnitMode } from "@/features/dashboard/shared/story-utils";
import { RectorDashboardFilters } from "@/features/dashboard/rector/types";

const BAR_COLORS = [
    "#ef4444", "#f59e0b", "#f97316", "#10b981", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308",
    "#d946ef", "#6366f1", "#64748b", "#a3a3a3",
];

const PARENTAL_LABEL: Record<string, string> = {
    TOGETHER: "อยู่ด้วยกัน", DIVORCED: "หย่าร้าง",
    FATHER_DECEASED: "บิดาเสียชีวิต", MOTHER_DECEASED: "มารดาเสียชีวิต",
    BOTH_DECEASED: "เสียชีวิตทั้งคู่", SINGLE_PARENT: "เลี้ยงเดี่ยว",
};

interface Props {
    apiPath: string;
    title: string;
    delay?: number;
    globalFilters?: RectorDashboardFilters;
}

export default function RectorProblemSection({ apiPath, title, delay = 0, globalFilters = {} }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [income, setIncome] = useState<string[]>([]);
    const [blood, setBlood] = useState<string[]>([]);
    const [parental, setParental] = useState<string[]>([]);
    const [chronic, setChronic] = useState<string[]>([]);
    const [deptIds, setDeptIds] = useState<string[]>([]);
    const [chronicConditions, setChronicConditions] = useState<{ id: number; nameTh: string }[]>([]);

    useEffect(() => {
        fetch('/api/v2/analytics/chronic-conditions', { credentials: 'include' })
            .then(r => r.json())
            .then(j => setChronicConditions(j.data ?? []))
            .catch(() => { });
    }, []);

    const mergedFilters: Record<string, string[]> = {
        department_ids: [
            ...(globalFilters.departmentId ? [String(globalFilters.departmentId)] : []),
            ...deptIds,
        ],
        family_income_bracket: income,
        blood_group: blood,
        parental_status: parental,
        chronic_condition_ids: chronic,
        ...(globalFilters.facultyId ? { faculty_ids: [String(globalFilters.facultyId)] } : {}),
        ...(globalFilters.gender ? { gender: [globalFilters.gender] } : {}),
        ...(globalFilters.problemCategoryId ? { problem_category_ids: [String(globalFilters.problemCategoryId)] } : {}),
    };

    const effectiveDate: DatePreset = globalFilters.startDate ? "custom" : date;
    const effectiveRange: DateRange | undefined = globalFilters.startDate
        ? {
            start: globalFilters.startDate.toISOString().split("T")[0],
            end: (globalFilters.endDate ?? new Date()).toISOString().split("T")[0],
        }
        : customRange;

    const { data, loading, meta } = useStoryData<any>(apiPath, "problems", mergedFilters, effectiveDate, effectiveRange);

    const categories = data?.categories ?? [];
    const totalProblems = categories.reduce((s: number, c: any) => s + c.count, 0);
    const barData = [...categories]
        .sort((a: any, b: any) => b.count - a.count)
        .map((c: any) => ({
            name: c.label,
            fullName: c.label,
            count: c.count,
            pct: totalProblems > 0 ? parseFloat((c.count / totalProblems * 100).toFixed(1)) : 0,
        }));

    const chartHeight = Math.max(200, barData.length * 36 + 40);

    return (
        <DataStoryCard
            icon={<AlertTriangle className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
            title={title}
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
                        {!globalFilters.startDate
                            ? <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
                            : <span className="text-[11px] text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-lg">ใช้ช่วงวันจาก Global Filter</span>
                        }
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    {meta?.departments?.length > 0 && !globalFilters.departmentId && (
                        <StoryChipGroup
                            label="ภาควิชา"
                            options={meta.departments.map((d: any) => ({ value: String(d.id), label: d.nameTh }))}
                            selected={deptIds}
                            onChange={setDeptIds}
                        />
                    )}
                    <StoryChipGroup label="รายได้" options={[
                        { value: "UNDER_100K", label: "< 100K" }, { value: "BETWEEN_100K_200K", label: "100-200K" },
                        { value: "BETWEEN_200K_300K", label: "200-300K" }, { value: "BETWEEN_300K_500K", label: "300-500K" },
                        { value: "BETWEEN_500K_800K", label: "500-800K" }, { value: "BETWEEN_800K_1M", label: "800K-1M" },
                        { value: "OVER_1M", label: "> 1M" },
                    ]} selected={income} onChange={setIncome} />
                    <StoryChipGroup label="กรุ๊ปเลือด" options={[
                        { value: "A", label: "A" }, { value: "B", label: "B" },
                        { value: "O", label: "O" }, { value: "AB", label: "AB" },
                    ]} selected={blood} onChange={setBlood} />
                    <StoryChipGroup label="สถานะบิดามารดา" options={[
                        { value: "TOGETHER", label: "อยู่ด้วยกัน" }, { value: "DIVORCED", label: "หย่าร้าง" },
                        { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" }, { value: "FATHER_DECEASED", label: "บิดาเสียชีวิต" },
                        { value: "MOTHER_DECEASED", label: "มารดาเสียชีวิต" }, { value: "BOTH_DECEASED", label: "เสียชีวิตทั้งคู่" },
                    ]} selected={parental} onChange={setParental} />
                    {chronicConditions.length > 0 && (
                        <StoryChipGroup label="โรคประจำตัว" options={chronicConditions.map(c => ({
                            value: String(c.id), label: c.nameTh
                        }))} selected={chronic} onChange={setChronic} />
                    )}
                </StoryFilterStack>
            }
            delay={delay}
            loading={loading}
        >
            {data && (
                <div className="space-y-4">
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
                                                {unit === "count" ? d.count.toLocaleString() : `${pct}%`}
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
                                            <span className="text-[11px] text-slate-600 flex-1">{PARENTAL_LABEL[d.label] ?? d.label}</span>
                                            <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                                                {unit === "count" ? d.count.toLocaleString() : `${pct}%`}
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
