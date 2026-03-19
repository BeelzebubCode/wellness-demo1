// src/features/dashboard/rector/components/sections/RectorRiskSection.tsx
"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ShieldAlert, AlertTriangle, TrendingDown, CheckCircle2, Minus } from "lucide-react";
import { DataStoryCard } from "@/features/dashboard/widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "@/features/dashboard/widgets/story/StoryFilterChips";
import { DatePresetBar } from "@/features/dashboard/shared/StoryUI";
import { useStoryData, Tip, RISK_META, type DatePreset, type DateRange } from "@/features/dashboard/shared/story-utils";

interface Props {
    apiPath: string;
    title: string;
    delay?: number;
}

function buildRiskInsights(
    distribution: { label: string; count: number }[],
    total: number,
    highRisk: number,
) {
    if (total === 0) return [];
    const insights: { icon: React.ReactNode; text: string; color: string }[] = [];

    const highPct     = Math.round((highRisk / total) * 100);
    const criticalRow = distribution.find(d => d.label === "CRITICAL");
    const critPct     = criticalRow ? Math.round((criticalRow.count / total) * 100) : 0;
    const normalRow   = distribution.find(d => d.label === "NORMAL" || d.label === "LOW");
    const normalPct   = normalRow   ? Math.round((normalRow.count   / total) * 100) : 0;

    if (critPct > 0) {
        insights.push({
            icon:  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />,
            color: "text-red-700 bg-red-50 border-red-200",
            text:  `🔴 พบนิสิตระดับวิกฤต ${criticalRow!.count.toLocaleString()} ราย (${critPct}%) — ต้องดำเนินการติดตามทันที`,
        });
    }

    if (highPct > 30) {
        insights.push({
            icon:  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />,
            color: "text-rose-700 bg-rose-50 border-rose-100",
            text:  `⚠ กลุ่มเสี่ยงสูง + วิกฤตรวมกัน ${highPct}% ของทั้งหมด — ควรเพิ่มบุคลากรรองรับ`,
        });
    } else if (highPct > 15) {
        insights.push({
            icon:  <TrendingDown className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />,
            color: "text-amber-700 bg-amber-50 border-amber-100",
            text:  `กลุ่มเสี่ยงสูง ${highPct}% — ควรวางแผน Follow-up เชิงรุกเพื่อลดความเสี่ยงสะสม`,
        });
    }

    if (normalPct >= 60) {
        insights.push({
            icon:  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />,
            color: "text-emerald-700 bg-emerald-50 border-emerald-100",
            text:  `✅ นิสิตระดับปกติ ${normalPct}% — ส่วนใหญ่อยู่ในเกณฑ์ดี ควรรักษาระดับนี้ไว้`,
        });
    }

    if (insights.length === 0) {
        insights.push({
            icon:  <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />,
            color: "text-slate-600 bg-slate-50 border-slate-100",
            text:  `ระดับความเสี่ยงโดยรวมอยู่ในเกณฑ์ที่บริหารจัดการได้ — ติดตามต่อเนื่องเพื่อป้องกันการเพิ่มขึ้น`,
        });
    }

    return insights;
}

function buildRiskNarration(total: number, highRisk: number): string {
    if (total === 0) return "ยังไม่มีข้อมูลการประเมินความเสี่ยงในช่วงนี้";
    const pct = Math.round((highRisk / total) * 100);
    if (pct > 30) return `ประเมินความเสี่ยง ${total.toLocaleString()} ครั้ง — ⚠ เสี่ยงสูง/วิกฤต ${highRisk.toLocaleString()} ราย (${pct}%) เกินเกณฑ์ ต้องเร่งดูแล`;
    if (pct > 15) return `ประเมินความเสี่ยง ${total.toLocaleString()} ครั้ง — เสี่ยงสูง ${highRisk.toLocaleString()} ราย (${pct}%) ควรติดตามอย่างใกล้ชิด`;
    return `ประเมินความเสี่ยง ${total.toLocaleString()} ครั้ง — เสี่ยงสูง ${highRisk.toLocaleString()} ราย (${pct}%) อยู่ในเกณฑ์ควบคุมได้`;
}

export default function RectorRiskSection({ apiPath, title, delay = 0 }: Props) {
    const [date, setDate]               = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [gender, setGender]           = useState<string[]>([]);
    const [income, setIncome]           = useState<string[]>([]);
    const [parental, setParental]       = useState<string[]>([]);
    const [blood, setBlood]             = useState<string[]>([]);
    const [deptIds, setDeptIds]         = useState<string[]>([]);

    const storyFilters: Record<string, string[]> = {
        department_ids:       deptIds,
        gender,
        family_income_bracket: income,
        parental_status:      parental,
        blood_group:          blood,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, loading, meta } = useStoryData<{
        distribution?: { label: string; count: number }[];
        highRiskCount?: number;
    }>(apiPath, "risk", storyFilters, date, customRange);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaDepts: { id: number; nameTh: string }[] = (meta as any)?.departments ?? [];
    const distribution = data?.distribution ?? [];
    const total        = distribution.reduce((s, d) => s + d.count, 0);
    const highRisk     = data?.highRiskCount ?? 0;
    const highPct      = total > 0 ? Math.round((highRisk / total) * 100) : 0;

    const pieData = distribution.map(d => {
        const m = RISK_META[d.label] ?? RISK_META.UNKNOWN;
        return { name: m.label, value: d.count, color: m.color };
    });

    const insights = data ? buildRiskInsights(distribution, total, highRisk) : [];

    return (
        <DataStoryCard
            icon={<ShieldAlert className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-rose-500 to-pink-600"
            title={title}
            description="การกระจายตัวของระดับความเสี่ยงนิสิตที่รับบริการ — ใช้วางแผนดูแลเชิงรุกและจัดสรรทรัพยากร"
            narration={data ? buildRiskNarration(total, highRisk) : "กำลังโหลด..."}
            kpis={data ? [
                { label: "ประเมินรวม", value: total,    color: "#4f46e5"  },
                { label: "สูง/วิกฤต", value: highRisk, color: "#f43f5e"  },
                { label: "อัตราสูง",  value: `${highPct}%`, color: "#f59e0b" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
                    {metaDepts.length > 0 && (
                        <StoryChipGroup
                            label="ภาควิชา"
                            options={metaDepts.map(d => ({ value: String(d.id), label: d.nameTh }))}
                            selected={deptIds}
                            onChange={setDeptIds}
                        />
                    )}
                    <StoryChipGroup label="เพศ" options={[
                        { value: "MALE",       label: "ชาย"    },
                        { value: "FEMALE",     label: "หญิง"   },
                        { value: "LGBTQ_PLUS", label: "LGBTQ+" },
                    ]} selected={gender} onChange={setGender} />
                    <StoryChipGroup label="รายได้" options={[
                        { value: "UNDER_100K",          label: "< 100K"   },
                        { value: "BETWEEN_100K_200K",   label: "100-200K" },
                        { value: "BETWEEN_200K_300K",   label: "200-300K" },
                        { value: "BETWEEN_300K_500K",   label: "300-500K" },
                        { value: "BETWEEN_500K_800K",   label: "500-800K" },
                        { value: "OVER_1M",             label: "> 1M"     },
                    ]} selected={income} onChange={setIncome} />
                    <StoryChipGroup label="ครอบครัว" options={[
                        { value: "TOGETHER",        label: "อยู่ด้วยกัน" },
                        { value: "DIVORCED",        label: "หย่าร้าง"   },
                        { value: "FATHER_DECEASED", label: "บิดาเสีย"   },
                        { value: "MOTHER_DECEASED", label: "มารดาเสีย"  },
                        { value: "SINGLE_PARENT",   label: "เลี้ยงเดี่ยว" },
                    ]} selected={parental} onChange={setParental} />
                    <StoryChipGroup label="กรุ๊ปเลือด" options={[
                        { value: "A", label: "A" }, { value: "B",  label: "B"  },
                        { value: "AB",label: "AB"}, { value: "O",  label: "O"  },
                    ]} selected={blood} onChange={setBlood} />
                </StoryFilterStack>
            }
            delay={delay}
            loading={loading}
        >
            {data && distribution.length > 0 && (
                <div className="space-y-4 mt-1">
                    {/* Donut + legend */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height={190}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name"
                                        cx="50%" cy="50%" outerRadius={75} innerRadius={45}
                                        paddingAngle={3} strokeWidth={0}>
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                    <Legend verticalAlign="bottom" iconType="circle"
                                        formatter={(v: string) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-40 shrink-0 space-y-1.5">
                            {distribution.map((d, i) => {
                                const m   = RISK_META[d.label] ?? RISK_META.UNKNOWN;
                                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                                return (
                                    <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${m.bg ?? "bg-slate-50"}`}>
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                                        <span className="text-[11px] text-slate-600 flex-1 truncate">{m.label}</span>
                                        <span className="text-[11px] font-bold text-slate-700 tabular-nums">{d.count}</span>
                                        <span className="text-[10px] text-slate-400">({pct}%)</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

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
            {data && distribution.length === 0 && (
                <div className="h-28 flex items-center justify-center text-slate-300 text-sm">
                    ยังไม่มีข้อมูลในช่วงเวลาที่เลือก
                </div>
            )}
        </DataStoryCard>
    );
}
