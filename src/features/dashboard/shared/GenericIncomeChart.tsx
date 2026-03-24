// src/features/dashboard/shared/GenericIncomeChart.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared income distribution chart — reusable across all dashboard roles
// Shows annual family income breakdown + parental status of students
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Wallet, TrendingDown, TrendingUp, Minus, AlertTriangle, Users } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { ExamPeriodFilter } from "../widgets/story/ExamPeriodFilter";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import { useStoryData, PIE_COLORS, INCOME_LABEL, type DatePreset, type DateRange, type UnitMode } from "./story-utils";



// Income bracket order: low → high
const INCOME_ORDER = [
    "UNDER_100K",
    "BETWEEN_100K_200K",
    "BETWEEN_200K_300K",
    "BETWEEN_300K_500K",
    "BETWEEN_500K_800K",
    "BETWEEN_800K_1M",
    "OVER_1M",
    "UNKNOWN",
];

const INCOME_COLORS = [
    "#10b981", // UNDER_100K   — emerald (ต่ำสุด)
    "#06b6d4", // 100-200K     — cyan
    "#3b82f6", // 200-300K     — blue
    "#8b5cf6", // 300-500K     — violet
    "#f59e0b", // 500-800K     — amber
    "#f97316", // 800K-1M      — orange
    "#ef4444", // OVER_1M      — red (สูงสุด)
    "#94a3b8", // UNKNOWN      — slate
];

interface Props {
    apiPath: string;
    title?: string;
    delay?: number;
    theme?: "light" | "dark";
}

function buildInsights(sortedData: { label: string; count: number; pct: number }[], total: number) {
    if (!sortedData.length || total === 0) return [];
    const insights: { icon: React.ReactNode; text: string; color: string }[] = [];

    // Top income group
    const topGroup = [...sortedData].sort((a, b) => b.count - a.count)[0];
    if (topGroup) {
        insights.push({
            icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" />,
            text: `กลุ่มรายได้ที่พบมากที่สุดคือ "${INCOME_LABEL[topGroup.label] ?? topGroup.label}" — ${topGroup.pct}% ของนิสิตทั้งหมด`,
            color: "bg-blue-50 border-blue-200 text-blue-700",
        });
    }

    // Low income group (<300K)
    const lowIncome = sortedData.filter(d => ["UNDER_100K", "BETWEEN_100K_200K", "BETWEEN_200K_300K"].includes(d.label));
    const lowPct = lowIncome.reduce((s, d) => s + d.pct, 0);
    if (lowPct > 40) {
        insights.push({
            icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
            text: `นิสิตรายได้ต่ำกว่า 300K/ปี รวม ${lowPct.toFixed(1)}% — ควรพิจารณาโครงการสนับสนุนทางการเงิน`,
            color: "bg-amber-50 border-amber-200 text-amber-700",
        });
    } else if (lowPct > 20) {
        insights.push({
            icon: <Minus className="w-3.5 h-3.5 shrink-0" />,
            text: `นิสิตรายได้ต่ำกว่า 300K/ปี รวม ${lowPct.toFixed(1)}% — ควรติดตามกลุ่มนี้เป็นพิเศษ`,
            color: "bg-slate-50 border-slate-200 text-slate-600",
        });
    }

    // High income group (>800K)
    const highIncome = sortedData.filter(d => ["BETWEEN_800K_1M", "OVER_1M"].includes(d.label));
    const highPct = highIncome.reduce((s, d) => s + d.pct, 0);
    if (highPct > 20) {
        insights.push({
            icon: <TrendingDown className="w-3.5 h-3.5 shrink-0" />,
            text: `นิสิตรายได้สูง (>800K/ปี) รวม ${highPct.toFixed(1)}% — ความหลากหลายทางเศรษฐกิจสูง`,
            color: "bg-purple-50 border-purple-200 text-purple-700",
        });
    }

    return insights;
}

export default function GenericIncomeChart({ apiPath, title = "โครงสร้างรายได้ครอบครัวนิสิต", delay = 0, theme = "light" }: Props) {
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

    const rawDist: { label: string; count: number }[] = data?.incomeDist ?? [];
    const total = rawDist.reduce((s, d) => s + d.count, 0);

    // Sort by income bracket order (low → high), filter UNKNOWN to end
    const sorted = INCOME_ORDER
        .map(key => rawDist.find(d => d.label === key))
        .filter(Boolean)
        .map(d => ({
            label: d!.label,
            name: INCOME_LABEL[d!.label] ?? d!.label,
            count: d!.count,
            pct: total > 0 ? parseFloat((d!.count / total * 100).toFixed(1)) : 0,
        }))
        .filter(d => d.count > 0);

    const insights = buildInsights(sorted, total);

    // narration
    const topGroup = [...sorted].sort((a, b) => b.count - a.count)[0];
    const lowPct = sorted
        .filter(d => ["UNDER_100K", "BETWEEN_100K_200K", "BETWEEN_200K_300K"].includes(d.label))
        .reduce((s, d) => s + d.pct, 0);
    const narration = topGroup
        ? `รายได้ที่พบมากที่สุดคือ "${topGroup.name}" (${topGroup.pct}%) — นิสิตรายได้ต่ำ <300K/ปี รวม ${lowPct.toFixed(1)}%`
        : "กำลังโหลด...";

    return (
        <DataStoryCard
            icon={<Wallet className="w-5 h-5" />}
            iconGradient={theme === "dark" ? undefined : "bg-gradient-to-br from-emerald-500 to-teal-600"}
            title={title}
            description="การกระจายตัวของระดับรายได้ต่อปีของครอบครัวนิสิต — ใช้วางแผนการสนับสนุนทางการเงิน ทุนการศึกษา และทรัพยากรให้ตรงกลุ่มเป้าหมาย"
            theme={theme}
            narration={loading ? "กำลังโหลด..." : narration}
            kpis={data && total > 0 ? [
                {
                    label: "นิสิตในฐานข้อมูล",
                    value: total.toLocaleString(),
                    color: "#10b981",
                },
                {
                    label: "กลุ่มรายได้",
                    value: sorted.length,
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
                    {/* Story Insights */}
                    {insights.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📊 Story Insights</p>
                            {insights.map((item, i) => (
                                <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs font-medium leading-relaxed ${item.color}`}>
                                    {item.icon}
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Income Bar Chart ── */}
                    {sorted.length > 0 ? (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                รายได้ครอบครัวต่อปี (บาท)
                            </p>
                            <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 38 + 40)}>
                                <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 16, top: 4, bottom: 4 }}>
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
                                        width={110}
                                        tick={{ fontSize: 12, fill: theme === "dark" ? "#cbd5e1" : "#475569", fontWeight: 600 }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: theme === "dark" ? "#1e293b" : "#f8fafc" }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.[0]) return null;
                                            const d = payload[0].payload;
                                            return (
                                                <div className={`border rounded-2xl p-3 shadow-2xl text-xs min-w-[160px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                                                    <p className={`font-bold mb-2 ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{d.name}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-slate-400">จำนวน:</span>
                                                            <span className={`font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{d.count.toLocaleString()} ราย</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-slate-400">สัดส่วน:</span>
                                                            <span className="font-bold text-emerald-600">{d.pct}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar
                                        dataKey={unit === "percent" ? "pct" : "count"}
                                        radius={[0, 8, 8, 0]}
                                        barSize={22}
                                    >
                                        {sorted.map((_, idx) => (
                                            <Cell key={idx} fill={INCOME_COLORS[INCOME_ORDER.indexOf(sorted[idx].label)] ?? PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Income legend summary */}
                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
                                {sorted.map((d, i) => {
                                    const colorIdx = INCOME_ORDER.indexOf(d.label);
                                    const color = INCOME_COLORS[colorIdx] ?? PIE_COLORS[i % PIE_COLORS.length];
                                    return (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <span className={`text-[11px] flex-1 truncate ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{d.name}</span>
                                            <span className={`text-[11px] font-bold tabular-nums ${theme === "dark" ? "text-slate-300" : "text-slate-500"}`}>{d.pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                            <Wallet className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm font-medium">ยังไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                        </div>
                    )}


                </div>
            )}
        </DataStoryCard>
    );
}
