// src/features/dashboard/rector/components/sections/RectorBookingSection.tsx
"use client";

import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DataStoryCard } from "@/features/dashboard/widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "@/features/dashboard/widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "@/features/dashboard/shared/StoryUI";
import { useStoryData, Tip, MONTH_LABEL, type DatePreset, type DateRange, type UnitMode } from "@/features/dashboard/shared/story-utils";

interface Props {
    apiPath: string;
    title: string;
    delay?: number;
}

/** Auto-generate insight bullets from booking data */
function buildBookingInsights(total: number, checkedIn: number, noShow: number, completed: number) {
    if (total === 0) return [];
    const insights: { icon: React.ReactNode; text: string; color: string }[] = [];

    const noShowPct = Math.round((noShow / total) * 100);
    const successPct = Math.round((completed / total) * 100);
    const attendPct = Math.round((checkedIn / total) * 100);

    // No-show signal
    if (noShowPct > 20) {
        insights.push({
            icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />,
            color: "text-rose-700 bg-rose-50 border-rose-100",
            text: `⚠ อัตราไม่มาตามนัดสูง ${noShowPct}% (${noShow.toLocaleString()} ครั้ง) — ควรวางระบบแจ้งเตือน/ยืนยันนัดอัตโนมัติ`,
        });
    } else if (noShowPct > 10) {
        insights.push({
            icon: <TrendingDown className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />,
            color: "text-amber-700 bg-amber-50 border-amber-100",
            text: `อัตราไม่มาตามนัดอยู่ที่ ${noShowPct}% — ควรติดตามสาเหตุและวางมาตรการลด`,
        });
    }

    // Success signal
    if (successPct >= 80) {
        insights.push({
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />,
            color: "text-emerald-700 bg-emerald-50 border-emerald-100",
            text: `อัตราสำเร็จสูง ${successPct}% — ระบบการให้บริการมีประสิทธิภาพดี`,
        });
    } else if (successPct < 50) {
        insights.push({
            icon: <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />,
            color: "text-rose-700 bg-rose-50 border-rose-100",
            text: `อัตราสำเร็จต่ำเพียง ${successPct}% — ควรตรวจสอบกระบวนการและอุปสรรคในระบบ`,
        });
    }

    // Attendance vs booking gap
    const gapPct = total > 0 ? Math.round(((total - checkedIn) / total) * 100) : 0;
    if (gapPct > 30 && noShowPct <= 20) {
        insights.push({
            icon: <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />,
            color: "text-blue-700 bg-blue-50 border-blue-100",
            text: `มีนัดที่ยังไม่เกิดขึ้น ${gapPct}% (${(total - checkedIn).toLocaleString()} รายการ) — อาจยังอยู่ระหว่างดำเนินการ`,
        });
    }

    if (insights.length === 0) {
        insights.push({
            icon: <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />,
            color: "text-slate-600 bg-slate-50 border-slate-100",
            text: `ภาพรวมการให้บริการ: เข้ารับ ${attendPct}% สำเร็จ ${successPct}% — อยู่ในเกณฑ์ปกติ`,
        });
    }

    return insights;
}

/** Smart narration sentence */
function buildNarration(total: number, noShow: number, completed: number): string {
    if (total === 0) return "ยังไม่มีข้อมูลในช่วงเวลานี้";
    const noShowPct = Math.round((noShow / total) * 100);
    const successPct = Math.round((completed / total) * 100);
    if (noShowPct > 20) return `มีการนัดหมาย ${total.toLocaleString()} ครั้ง — ⚠ ต้องระวัง: ไม่มาตามนัดสูงถึง ${noShowPct}% ซึ่งเกินเกณฑ์ที่ควร`;
    if (successPct >= 80) return `มีการนัดหมาย ${total.toLocaleString()} ครั้ง — ✅ สำเร็จ ${successPct}% ระบบมีประสิทธิภาพสูง`;
    return `มีการนัดหมาย ${total.toLocaleString()} ครั้ง — สำเร็จ ${successPct}% ไม่มา ${noShowPct}%`;
}

export default function RectorBookingSection({ apiPath, title, delay = 0 }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [status, setStatus] = useState<string[]>([]);
    const [attendance, setAttendance] = useState<string[]>([]);
    const [service, setService] = useState<string[]>([]);
    const [deptIds, setDeptIds] = useState<string[]>([]);

    const storyFilters: Record<string, string[]> = {
        booking_status: status,
        attendance_status: attendance,
        service_mode: service,
        department_ids: deptIds,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, loading, meta } = useStoryData<{
        totalBookings?: number;
        checkedInCount?: number;
        noShowCount?: number;
        completedCount?: number;
        monthlyTrend?: { month: string; bookings: number; checkedIn: number }[];
    }>(apiPath, "bookings", storyFilters, date, customRange);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaDepts: { id: number; nameTh: string }[] = (meta as any)?.departments ?? [];
    const total = data?.totalBookings ?? 0;
    const checkedIn = data?.checkedInCount ?? 0;
    const noShow = data?.noShowCount ?? 0;
    const completed = data?.completedCount ?? 0;

    const trendData = (data?.monthlyTrend ?? []).map((m) => ({
        month: MONTH_LABEL[m.month?.split("-")[1]] || m.month,
        จอง: m.bookings,
        มาจริง: m.checkedIn,
    }));

    const insights = data ? buildBookingInsights(total, checkedIn, noShow, completed) : [];

    return (
        <DataStoryCard
            icon={<Calendar className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            title={title}
            description="ติดตามการนัดหมายและผลการเข้ารับบริการ — วัดประสิทธิภาพระบบและพฤติกรรมนิสิต"
            narration={data ? buildNarration(total, noShow, completed) : "กำลังโหลด..."}
            kpis={data ? [
                { label: "นัดหมายรวม", value: total, color: "#059669" },
                { label: "มาตามนัด", value: checkedIn, color: "#10b981" },
                { label: "ไม่มา", value: noShow, color: "#f43f5e" },
                { label: "สำเร็จ", value: completed, color: "#4f46e5" },
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
                            selected={deptIds}
                            onChange={setDeptIds}
                        />
                    )}
                    <StoryChipGroup label="สถานะ" options={[
                        { value: "PENDING_ASSIGNMENT", label: "รอประสาน" },
                        { value: "CONFIRMED", label: "ยืนยัน" },
                        { value: "IN_PROGRESS", label: "กำลังดำเนิน" },
                        { value: "COMPLETED", label: "เสร็จ" },
                        { value: "CANCELLED", label: "ยกเลิก" },
                    ]} selected={status} onChange={setStatus} />
                    <StoryChipGroup label="เข้าพบ" options={[
                        { value: "CHECKED_IN", label: "เข้าพบ" },
                        { value: "LATE", label: "สาย" },
                        { value: "NO_SHOW", label: "ไม่มา" },
                    ]} selected={attendance} onChange={setAttendance} />
                    <StoryChipGroup label="บริการ" options={[
                        { value: "ONLINE", label: "ออนไลน์" },
                        { value: "ONSITE", label: "ออนไซต์" },
                    ]} selected={service} onChange={setService} />
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
                    {/* Trend chart */}
                    {trendData.length > 0 && (
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">แนวโน้มรายเดือน</p>
                            <ResponsiveContainer width="100%" height={170}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={35} />
                                    <Tooltip content={<Tip />} />
                                    <Legend verticalAlign="bottom" iconType="circle"
                                        formatter={(v: string) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>} />
                                    <Line type="monotone" dataKey="จอง" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="มาจริง" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
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

                    {trendData.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-slate-300 text-sm">
                            ยังไม่มีข้อมูลในช่วงเวลาที่เลือก
                        </div>
                    )}
                </div>
            )}
        </DataStoryCard>
    );
}
