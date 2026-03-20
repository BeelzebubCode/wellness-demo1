// src/features/dashboard/rector/components/sections/RectorProblemSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, TrendingUp, CheckCircle2, Minus } from "lucide-react";
import { DataStoryCard } from "@/features/dashboard/widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "@/features/dashboard/widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "@/features/dashboard/shared/StoryUI";
import { useStoryData, PIE_COLORS, INCOME_LABEL, type DatePreset, type DateRange, type UnitMode } from "@/features/dashboard/shared/story-utils";

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

interface Props { apiPath: string; title: string; delay?: number; }

function buildProblemInsights(
    categories: { label: string; count: number }[],
    total: number,
) {
    if (total === 0 || categories.length === 0) return [];
    const insights: { icon: React.ReactNode; text: string; color: string }[] = [];

    const top = categories[0];
    const topPct = Math.round((top.count / total) * 100);

    // Top problem concentration
    if (topPct > 40) {
        insights.push({
            icon: <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />,
            color: "text-rose-700 bg-rose-50 border-rose-100",
            text: `⚠ ปัญหา "${top.label}" มีสัดส่วนสูงมากถึง ${topPct}% — ควรออกแบบโปรแกรมเฉพาะเจาะจง`,
        });
    } else if (topPct > 25) {
        insights.push({
            icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />,
            color: "text-amber-700 bg-amber-50 border-amber-100",
            text: `"${top.label}" เป็นปัญหาอันดับ 1 (${topPct}%) — ควรวางมาตรการป้องกันเชิงรุก`,
        });
    } else {
        insights.push({
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />,
            color: "text-blue-700 bg-blue-50 border-blue-100",
            text: `ปัญหากระจายตัวหลายประเภท — "${top.label}" นำ (${topPct}%) ควรดูแลแบบองค์รวม`,
        });
    }

    // Diversity of problems
    if (categories.length >= 8) {
        insights.push({
            icon: <TrendingUp className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />,
            color: "text-purple-700 bg-purple-50 border-purple-100",
            text: `พบปัญหาหลากหลายถึง ${categories.length} ประเภท — ควรมีบุคลากรที่มีความเชี่ยวชาญหลากหลายด้าน`,
        });
    }

    // Top 3 coverage
    const top3Total = categories.slice(0, 3).reduce((s, c) => s + c.count, 0);
    const top3Pct = Math.round((top3Total / total) * 100);
    if (top3Pct >= 70 && categories.length > 3) {
        insights.push({
            icon: <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />,
            color: "text-slate-700 bg-slate-50 border-slate-100",
            text: `3 ปัญหาแรกคิดเป็น ${top3Pct}% ของทั้งหมด — การแก้ไข 3 ปัญหานี้จะส่งผลกระทบสูงสุด`,
        });
    }

    return insights;
}

function buildProblemNarration(categories: { label: string; count: number }[], total: number): string {
    if (total === 0) return "ยังไม่มีข้อมูลประเภทปัญหาในช่วงนี้";
    const top = categories[0];
    if (!top) return `บันทึกปัญหาทั้งหมด ${total.toLocaleString()} กรณี จาก ${categories.length} ประเภท`;
    const topPct = Math.round((top.count / total) * 100);
    return `${total.toLocaleString()} กรณีจาก ${categories.length} ประเภท — "${top.label}" มากสุด ${topPct}% (${top.count.toLocaleString()} ครั้ง)`;
}

export default function RectorProblemSection({ apiPath, title, delay = 0 }: Props) {
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
        fetch("/api/v2/analytics/chronic-conditions", { credentials: "include" })
            .then(r => r.json())
            .then(j => setChronicConditions(j.data ?? []))
            .catch(() => { /* silent */ });
    }, []);

    const storyFilters: Record<string, string[]> = {
        department_ids: deptIds,
        family_income_bracket: income,
        blood_group: blood,
        parental_status: parental,
        chronic_condition_ids: chronic,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, loading, meta } = useStoryData<{
        categories?: { label: string; count: number }[];
        incomeDist?: { label: string; count: number }[];
        parentalDist?: { label: string; count: number }[];
    }>(apiPath, "problems", storyFilters, date, customRange);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaDepts: { id: number; nameTh: string }[] = (meta as any)?.departments ?? [];
    const categories = data?.categories ?? [];
    const totalProblems = categories.reduce((s, c) => s + c.count, 0);
    const barData = [...categories]
        .sort((a, b) => b.count - a.count)
        .map(c => ({
            name: c.label,
            count: c.count,
            pct: totalProblems > 0 ? parseFloat(((c.count / totalProblems) * 100).toFixed(1)) : 0,
        }));

    const chartHeight = Math.max(200, barData.length * 34 + 40);
    const insights = data ? buildProblemInsights(categories, totalProblems) : [];

    return (
        <DataStoryCard
            icon={<AlertTriangle className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
            title={title}
            description="ประเภทปัญหาที่นิสิตนำเข้ามาขอรับบริการ — ใช้วิเคราะห์แนวโน้มและวางแผนป้องกันเชิงรุก"
            narration={data ? buildProblemNarration(categories, totalProblems) : "กำลังโหลด..."}
            kpis={data ? [
                { label: "กรณีทั้งหมด", value: totalProblems, color: "#f59e0b" },
                { label: "ประเภท", value: categories.length, color: "#4f46e5" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <div className="flex items-center justify-between gap-3">
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={(meta as any)?.dataRange} />
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    {metaDepts.length > 0 && (
                        <StoryChipGroup
                            label="ภาควิชา"
                            options={metaDepts.map(d => ({ value: String(d.id), label: d.nameTh }))}
                            selected={deptIds} onChange={setDeptIds}
                        />
                    )}
                    <StoryChipGroup label="รายได้" options={[
                        { value: "UNDER_100K", label: "< 100K" },
                        { value: "BETWEEN_100K_200K", label: "100-200K" },
                        { value: "BETWEEN_200K_300K", label: "200-300K" },
                        { value: "BETWEEN_300K_500K", label: "300-500K" },
                        { value: "BETWEEN_500K_800K", label: "500-800K" },
                        { value: "BETWEEN_800K_1M", label: "800K-1M" },
                        { value: "OVER_1M", label: "> 1M" },
                    ]} selected={income} onChange={setIncome} />
                    <StoryChipGroup label="กรุ๊ปเลือด" options={[
                        { value: "A", label: "A" }, { value: "B", label: "B" },
                        { value: "O", label: "O" }, { value: "AB", label: "AB" },
                    ]} selected={blood} onChange={setBlood} />
                    <StoryChipGroup label="สถานะบิดามารดา" options={[
                        { value: "TOGETHER", label: "อยู่ด้วยกัน" },
                        { value: "DIVORCED", label: "หย่าร้าง" },
                        { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" },
                        { value: "FATHER_DECEASED", label: "บิดาเสียชีวิต" },
                        { value: "MOTHER_DECEASED", label: "มารดาเสียชีวิต" },
                        { value: "BOTH_DECEASED", label: "เสียชีวิตทั้งคู่" },
                    ]} selected={parental} onChange={setParental} />
                    {chronicConditions.length > 0 && (
                        <StoryChipGroup label="โรคประจำตัว"
                            options={chronicConditions.map(c => ({ value: String(c.id), label: c.nameTh }))}
                            selected={chronic} onChange={setChronic} />
                    )}
                </StoryFilterStack>
            }
            datePreset={date}
            dataRange={(meta as any)?.dataRange}
            customRange={customRange}
            delay={delay}
            loading={loading}
        >
            {data && (
                <div className="space-y-4 mt-1">
                    {/* Bar chart */}
                    {barData.length > 0 ? (
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">ประเภทปัญหา (เรียงจากมากไปน้อย)</p>
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 35 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }}
                                        tickFormatter={(v: number) => unit === "percent" ? `${v}%` : v.toLocaleString()} />
                                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }} />
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.[0]) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900/95 rounded-xl px-3 py-2 text-xs border border-white/10 shadow-xl">
                                                <p className="font-bold text-white mb-1">{d.name}</p>
                                                <p className="text-white/70">จำนวน: <span className="font-bold text-white">{d.count?.toLocaleString()}</span></p>
                                                <p className="text-white/70">สัดส่วน: <span className="font-bold text-amber-300">{d.pct}%</span></p>
                                            </div>
                                        );
                                    }} />
                                    <Bar dataKey={unit === "percent" ? "pct" : "count"} radius={[0, 6, 6, 0]} barSize={18}>
                                        {barData.map((_d, idx) => (
                                            <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-slate-300 text-sm">
                            ยังไม่มีข้อมูลในช่วงเวลาที่เลือก
                        </div>
                    )}

                    {/* Insight Box */}
                    {insights.length > 0 && (
                        <div className="border-t border-slate-50 pt-3 space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📊 Story Insights</p>
                            {insights.map((ins, i) => (
                                <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs font-medium leading-relaxed ${ins.color}`}>
                                    {ins.icon}
                                    <span>{ins.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </DataStoryCard>
    );
}
