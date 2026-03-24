// src/features/dashboard/shared/GenericParentalStatusChart.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared parental status distribution chart — reusable across all dashboard roles
// Shows parental status breakdown of students
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Users } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { ExamPeriodFilter } from "../widgets/story/ExamPeriodFilter";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import { useStoryData, type DatePreset, type DateRange, type UnitMode } from "./story-utils";

const PARENTAL_LABEL: Record<string, string> = {
    TOGETHER: "อยู่ด้วยกัน",
    DIVORCED: "หย่าร้าง",
    SINGLE_PARENT: "เลี้ยงเดี่ยว",
    FATHER_DECEASED: "บิดาเสียชีวิต",
    MOTHER_DECEASED: "มารดาเสียชีวิต",
    BOTH_DECEASED: "เสียชีวิตทั้งคู่",
    UNKNOWN: "ไม่ระบุ",
};

const PARENTAL_COLORS: Record<string, string> = {
    TOGETHER: "#10b981",
    DIVORCED: "#f59e0b",
    SINGLE_PARENT: "#3b82f6",
    FATHER_DECEASED: "#f97316",
    MOTHER_DECEASED: "#8b5cf6",
    BOTH_DECEASED: "#ef4444",
    UNKNOWN: "#94a3b8",
};

const PARENTAL_ORDER = [
    "TOGETHER", "DIVORCED", "SINGLE_PARENT",
    "FATHER_DECEASED", "MOTHER_DECEASED", "BOTH_DECEASED", "UNKNOWN",
];

interface Props {
    apiPath: string;
    title?: string;
    delay?: number;
    theme?: "light" | "dark";
}

export default function GenericParentalStatusChart({ apiPath, title = "สถานะบิดามารดานิสิต", delay = 0, theme = "light" }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [gender, setGender] = useState<string[]>([]);
    const [deptIds, setDeptIds] = useState<string[]>([]);
    const [problemCatIds, setProblemCatIds] = useState<string[]>([]);
    const [examPeriod, setExamPeriod] = useState<string[]>([]);
    const [problemCategories, setProblemCategories] = useState<{ id: string; name: string }[]>([]);

    React.useEffect(() => {
        fetch("/api/v2/master/filter-options", { credentials: "include", cache: "no-store" })
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data?.problemCategories) {
                    setProblemCategories(json.data.problemCategories.map((c: any) => ({
                        id: String(c.problem_category_id),
                        name: c.problem_category_name_th
                    })));
                }
            })
            .catch(() => {});
    }, []);

    const { data, loading, meta } = useStoryData<any>(apiPath, "problems", {
        gender,
        department_ids: deptIds,
        problem_category_ids: problemCatIds,
        exam_period: examPeriod,
    }, date, customRange);

    const rawParental: { label: string; count: number }[] = data?.parentalDist ?? [];
    const parentalTotal = rawParental.reduce((s, d) => s + d.count, 0);

    const sortedParental = PARENTAL_ORDER
        .map(key => rawParental.find(d => d.label === key))
        .filter(Boolean)
        .map(d => ({
            label: d!.label,
            name: PARENTAL_LABEL[d!.label] ?? d!.label,
            count: d!.count,
            color: PARENTAL_COLORS[d!.label] ?? "#94a3b8",
            pct: parentalTotal > 0 ? parseFloat((d!.count / parentalTotal * 100).toFixed(1)) : 0,
        }))
        .filter(d => d.count > 0);

    const topGroup = [...sortedParental].sort((a, b) => b.count - a.count)[0];
    const narration = topGroup
        ? `สถานะที่พบมากที่สุดคือ "${topGroup.name}" (${topGroup.pct}%) จากนิสิตทั้งหมดที่พบ ${parentalTotal.toLocaleString()} ครั้ง`
        : "กำลังโหลด...";

    return (
        <DataStoryCard
            icon={<Users className="w-5 h-5" />}
            iconGradient={theme === "dark" ? undefined : "bg-gradient-to-br from-indigo-500 to-purple-600"}
            title={title}
            description="ภาพรวมสถานะครอบครัวและบิดามารดาของนิสิต — เพื่อทำความเข้าใจสภาพแวดล้อมทางครอบครัวและความหลากหลายของพื้นฐานนิสิต เพื่อวางแผนการดูแลและให้คำปรึกษาที่เหมาะสมสอดคล้องกับบริบทพื้นฐานของแต่ละบุคคล"
            theme={theme}
            narration={loading ? "กำลังโหลด..." : narration}
            kpis={data && parentalTotal > 0 ? [
                {
                    label: "นิสิตในฐานข้อมูล",
                    value: parentalTotal.toLocaleString(),
                    color: "#6366f1",
                },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <div className="flex items-center justify-between gap-3">
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={meta?.dataRange} />
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    {(meta as any)?.departments?.length > 0 && (
                        <StoryChipGroup
                            label="ภาควิชา"
                            options={(meta as any).departments.map((d: any) => ({ value: String(d.id), label: d.nameTh }))}
                            selected={deptIds}
                            onChange={setDeptIds}
                        />
                    )}
                    {problemCategories.length > 0 && (
                        <StoryChipGroup
                            label="ประเภทปัญหา"
                            options={problemCategories.map(c => ({ value: c.id, label: c.name }))}
                            selected={problemCatIds}
                            onChange={setProblemCatIds}
                        />
                    )}
                    <StoryChipGroup label="เพศ" options={[
                        { value: "MALE", label: "ชาย" },
                        { value: "FEMALE", label: "หญิง" },
                        { value: "OTHER", label: "อื่นๆ" },
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
                <div className="space-y-5">
                    {sortedParental.length > 0 ? (
                        <div className="pt-2">
                            <ResponsiveContainer width="100%" height={Math.max(160, sortedParental.length * 36 + 20)}>
                                <BarChart data={sortedParental} layout="vertical" margin={{ left: 10, right: 16, top: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#f1f5f9"} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: theme === "dark" ? "#64748b" : "#94a3b8" }}
                                        tickFormatter={(v: number) => unit === "percent" ? `${v}%` : v.toLocaleString()}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={120}
                                        tick={{ fontSize: 12, fill: theme === "dark" ? "#cbd5e1" : "#475569", fontWeight: 600 }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: theme === "dark" ? "#1e293b" : "#f8fafc" }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.[0]) return null;
                                            const d = payload[0].payload;
                                            const isDark = theme === "dark";
                                            return (
                                                <div className={`border rounded-2xl p-3 shadow-2xl text-xs min-w-[160px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                                                    <p className={`font-bold mb-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{d.name}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-slate-400">จำนวน:</span>
                                                            <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{d.count.toLocaleString()} ราย</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-slate-400">สัดส่วน:</span>
                                                            <span className="font-bold text-indigo-600">{d.pct}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar
                                        dataKey={unit === "percent" ? "pct" : "count"}
                                        radius={[0, 8, 8, 0]}
                                        barSize={20}
                                    >
                                        {sortedParental.map((d, idx) => (
                                            <Cell key={idx} fill={d.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3">
                                {sortedParental.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                        <span className={`text-[11px] flex-1 truncate ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{d.name}</span>
                                        <span className={`text-[11px] font-bold tabular-nums ${theme === "dark" ? "text-slate-300" : "text-slate-500"}`}>{d.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                            <Users className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm font-medium">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                        </div>
                    )}
                </div>
            )}
        </DataStoryCard>
    );
}
