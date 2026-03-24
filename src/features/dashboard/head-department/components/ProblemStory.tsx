// src/features/dashboard/head-department/components/ProblemStory.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ประเด็นปัญหาที่นิสิตเข้ารับคำปรึกษา + โปรไฟล์นิสิต
// (merged: problems + health + family → one actionable story)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Sparkles, MousePointerClick } from "lucide-react";
import ProblemDrillDown from "./ProblemDrillDown";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import {
    useStoryData, Tip, INCOME_LABEL,
    type DatePreset, type DateRange, type UnitMode,
} from "./story-utils";

interface NameValue { name: string; value: number }

// ─── Reusable horizontal bar sub-chart ──────────────────────────────────────
function HorizontalBars({
    data,
    total,
    unit,
    barColor,
    gradientId,
    onBarClick,
}: {
    data: { name: string; value: number }[];
    total: number;
    unit: UnitMode;
    barColor: [string, string];
    gradientId: string;
    onBarClick?: (name: string) => void;
}) {
    const chartData = data.map(d => ({
        ...d,
        display: unit === "percent" && total > 0
            ? Math.round(d.value / total * 100) : d.value,
        pct: total > 0 ? Math.round(d.value / total * 100) : 0,
    }));

    return (
        <ResponsiveContainer width="100%" height={data.length * 28 + 10}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={barColor[0]} />
                        <stop offset="100%" stopColor={barColor[1]} />
                    </linearGradient>
                </defs>
                <XAxis
                    type="number"
                    domain={unit === "percent" ? [0, 100] : undefined}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => unit === "percent" ? `${v}%` : `${v}`}
                />
                <YAxis
                    type="category" dataKey="name"
                    tick={{ fontSize: 12, fill: "#475569" }}
                    width={110} axisLine={false} tickLine={false}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as typeof chartData[0];
                        return (
                            <div className="bg-slate-900/95 backdrop-blur rounded-xl shadow-2xl px-4 py-2.5 text-xs border border-white/10">
                                <p className="font-bold text-white mb-1">{p.name}</p>
                                <p className="text-white/70">{p.value.toLocaleString()} คน ({p.pct}%)</p>
                            </div>
                        );
                    }}
                />
                <Bar
                    dataKey="display"
                    name={unit === "percent" ? "%" : "จำนวน"}
                    fill={`url(#${gradientId})`}
                    radius={[0, 6, 6, 0]}
                    barSize={16}
                    cursor={onBarClick ? "pointer" : undefined}
                    onClick={onBarClick ? (_: any, idx: number) => {
                        const item = chartData[idx];
                        if (item) onBarClick(item.name);
                    } : undefined}
                    label={({ x, y, width, height, value }: any) => (
                        <text
                            x={x + width + 4} y={y + height / 2}
                            fill="#64748b" fontSize={11} dominantBaseline="middle"
                            fontWeight={500}
                        >
                            {unit === "percent" ? `${value}%` : value}
                        </text>
                    )}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ProblemStory({ delay = 0 }: { delay?: number }) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [drillCategory, setDrillCategory] = useState<string | null>(null);

    // Cross-analysis filters
    const [income, setIncome] = useState<string[]>([]);
    const [parental, setParental] = useState<string[]>([]);
    const [chronic, setChronic] = useState<string[]>([]);
    const [advisorId, setAdvisorId] = useState<string[]>([]);

    const { data, loading, advisors, dataRange } = useStoryData<any>("problems", {
        family_income_bracket: income,
        parental_status: parental,
        chronic_condition_ids: chronic,
        advisorId,
    }, date, customRange);

    const cats: { label: string; count: number }[] = data?.categories ?? [];
    const totalProb = cats.reduce((a, c) => a + c.count, 0);

    // Problem categories → horizontal bars
    const problemData: NameValue[] = cats.map(c => ({ name: c.label, value: c.count }));

    // Income
    const incomeData: NameValue[] = useMemo(() =>
        (data?.incomeDist ?? []).filter((d: any) => d.label !== "UNKNOWN")
            .map((d: any) => ({ name: INCOME_LABEL[d.label] ?? d.label, value: d.count })), [data?.incomeDist]);

    // Chronic top 5
    const chronicRaw: { label: string; count: number }[] = data?.chronicDist?.slice(0, 5) ?? [];
    const chronicData: NameValue[] = chronicRaw.map(c => ({ name: c.label, value: c.count }));
    const chronicTotal = chronicData.reduce((a, c) => a + c.value, 0);

    // Smart narration
    const topProblem = cats[0];
    const topIncome = incomeData[0];
    const narration = topProblem
        ? `ปัญหาอันดับ 1: "${topProblem.label}" (${topProblem.count} ครั้ง)` +
        (topIncome ? ` · กลุ่มรายได้มาก: ${topIncome.name}` : "")
        : "กำลังโหลด...";

    return (
        <>
            <DataStoryCard
                icon={<Sparkles className="w-5 h-5" />}
                iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
                title="ประเด็นปัญหาและโปรไฟล์นิสิตที่มาปรึกษา"
                description="วิเคราะห์ประเภทประเด็นปัญหาที่นิสิตนำเข้ามาปรึกษา พร้อมเจาะลึกข้อมูลโรคประจำตัวของนิสิต — เพื่อความเข้าใจเชิงลึกถึงต้นเหตุของปัญหาที่เกิดขึ้นบ่อย และใช้วางแผนจัดกิจกรรมสันทนาการหรือ workshop เยียวยาสุขภาพจิตให้ตรงจุดตามสภาพปัญหาจริง"
                narration={narration}
                kpis={cats.length ? [
                    { label: "ประเภทปัญหา", value: cats.length, color: "#f59e0b" },
                    { label: "รวม", value: `${totalProb || 0} ครั้ง`, color: "#ea580c" },
                    ...(chronicTotal > 0 ? [{ label: "มีโรคประจำตัว", value: `${chronicTotal || 0} คน`, color: "#f43f5e" }] : []),
                ] : undefined}
                filters={
                    <StoryFilterStack>
                        <div className="flex items-center justify-between gap-3">
                            <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={dataRange} />
                            <UnitToggle value={unit} onChange={setUnit} />
                        </div>
                        <StoryChipGroup label="รายได้" options={[
                            { value: "UNDER_100K", label: "< 100K" }, { value: "BETWEEN_100K_200K", label: "100-200K" },
                            { value: "BETWEEN_200K_300K", label: "200-300K" }, { value: "BETWEEN_300K_500K", label: "300-500K" },
                            { value: "BETWEEN_500K_800K", label: "500-800K" }, { value: "BETWEEN_800K_1M", label: "800K-1M" },
                            { value: "OVER_1M", label: "> 1M" },
                        ]} selected={income} onChange={setIncome} />
                        <StoryChipGroup label="ครอบครัว" options={[
                            { value: "TOGETHER", label: "อยู่ด้วยกัน" }, { value: "DIVORCED", label: "หย่าร้าง" },
                            { value: "FATHER_DECEASED", label: "บิดาเสีย" }, { value: "MOTHER_DECEASED", label: "มารดาเสีย" },
                            { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" },
                        ]} selected={parental} onChange={setParental} />
                        {advisors.length > 0 && (
                            <StoryChipGroup
                                label="อาจารย์ที่ปรึกษา"
                                options={advisors.map(a => ({ value: String(a.id), label: a.name }))}
                                selected={advisorId}
                                onChange={setAdvisorId}
                            />
                        )}
                    </StoryFilterStack>
                }
                datePreset={date}
                dataRange={dataRange}
                customRange={customRange}
                delay={delay}
                loading={loading}
            >
                <div className="space-y-5">
                    {/* ── Main: Problem Categories (horizontal bars — easy to read Thai) ── */}
                    {problemData.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">ประเภทปัญหาที่พบ</p>
                                <span className="text-[9px] text-amber-500 flex items-center gap-1">
                                    <MousePointerClick className="w-3 h-3" /> คลิกแท่งเพื่อดูรายชื่อนิสิต
                                </span>
                            </div>
                            <HorizontalBars
                                data={problemData}
                                total={totalProb}
                                unit={unit}
                                barColor={["#f59e0b", "#fbbf24"]}
                                gradientId="prob"
                                onBarClick={setDrillCategory}
                            />
                        </div>
                    )}

                    {/* ── Profile breakdowns ── */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Chronic conditions */}
                        {chronicData.length > 0 && (
                            <div className="bg-gradient-to-br from-rose-50/80 to-pink-50/80 rounded-xl p-3 border border-rose-100/50">
                                <p className="text-xs text-rose-600 font-bold mb-2 uppercase tracking-wider">🏥 โรคประจำตัว (Top 5)</p>
                                <HorizontalBars
                                    data={chronicData}
                                    total={chronicTotal}
                                    unit={unit}
                                    barColor={["#e11d48", "#fb7185"]}
                                    gradientId="chr"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </DataStoryCard>

            {/* Drill-down Modal */}
            <ProblemDrillDown
                categoryName={drillCategory}
                onClose={() => setDrillCategory(null)}
            />
        </>
    );
}
