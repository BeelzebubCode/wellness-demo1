// src/features/dashboard/shared/GenericBookingStory.tsx
"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { ExamPeriodFilter } from "../widgets/story/ExamPeriodFilter";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import { useStoryData, Tip, MONTH_LABEL, type DatePreset, type DateRange, type UnitMode } from "./story-utils";

interface Props { apiPath: string; title: string; delay?: number; description?: string; theme?: "light" | "dark" }

export default function GenericBookingStory({ apiPath, title, delay = 0, description, theme = "light" }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [status, setStatus] = useState<string[]>([]);
    const [attendance, setAttendance] = useState<string[]>([]);
    const [service, setService] = useState<string[]>([]);
    const [deptIds, setDeptIds] = useState<string[]>([]);
    const [gender, setGender] = useState<string[]>([]);
    const [yearLevel, setYearLevel] = useState<string[]>([]);
    const [income, setIncome] = useState<string[]>([]);
    const [parental, setParental] = useState<string[]>([]);
    const [examPeriod, setExamPeriod] = useState<string[]>([]);

    interface BookingTrendItem { month: string; bookings: number; checkedIn: number }
    interface BookingData {
        totalBookings: number;
        checkedInCount: number;
        noShowCount: number;
        completedCount: number;
        trendMode?: "year" | "month";
        monthlyTrend?: BookingTrendItem[];
    }

    const { data, loading, meta } = useStoryData<BookingData>(apiPath, "bookings", {
        booking_status: status,
        attendance_status: attendance,
        service_mode: service,
        department_ids: deptIds,
        gender,
        year_level: yearLevel,
        family_income_bracket: income,
        parental_status: parental,
        exam_period: examPeriod,
    }, date, customRange);

    const total = data?.totalBookings ?? 0;
    const checkedIn = data?.checkedInCount ?? 0;
    const noShow = data?.noShowCount ?? 0;
    const completed = data?.completedCount ?? 0;

    const calc = (val: number) => unit === "percent" && total > 0 ? ((val / total) * 100).toFixed(1) + "%" : val;

    const isYearly = data?.trendMode === "year";

    const trendData = useMemo(() => (data?.monthlyTrend ?? []).map((m) => ({
        label: isYearly
            ? `พ.ศ. ${m.month}`
            : (MONTH_LABEL[m.month?.split("-")[1]] || m.month),
        จอง: m.bookings,
        มาจริง: unit === "percent" && m.bookings > 0 ? Number(((m.checkedIn / m.bookings) * 100).toFixed(1)) : m.checkedIn,
    })), [data?.monthlyTrend, isYearly, unit]);

    return (
        <DataStoryCard
            icon={<Calendar className="w-5 h-5" />}
            iconGradient={theme === "dark" ? undefined : "bg-gradient-to-br from-emerald-500 to-teal-600"}
            title={title}
            description={description}
            theme={theme}
            narration={
                data ? `การนัดหมายทั้งหมด ${total.toLocaleString()} ครั้ง — มาตามนัด ${checkedIn.toLocaleString()} ครั้ง / ไม่มา ${noShow.toLocaleString()} ครั้ง / สำเร็จ ${completed.toLocaleString()} ครั้ง`
                    : "กำลังโหลด..."
            }
            kpis={data ? [
                { label: "นัดหมายรวม", value: total, color: "#059669" },
                { label: "มาตามนัด", value: calc(checkedIn), color: "#10b981" },
                { label: "ไม่มา", value: calc(noShow), color: "#f43f5e" },
                { label: "สำเร็จ", value: calc(completed), color: "#4f46e5" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <div className="flex items-center justify-between gap-3">
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={meta?.dataRange} />
                        <UnitToggle value={unit} onChange={setUnit} />
                    </div>
                    {meta?.departments?.length > 0 && (
                        <StoryChipGroup
                            label="ภาควิชา"
                            options={meta.departments.map((d: any) => ({ value: String(d.id), label: d.nameTh }))}
                            selected={deptIds}
                            onChange={setDeptIds}
                        />
                    )}
                    <ExamPeriodFilter selected={examPeriod} onChange={setExamPeriod} />
                    <StoryChipGroup label="เพศ" options={[
                        { value: "MALE", label: "ชาย" },
                        { value: "FEMALE", label: "หญิง" },
                        { value: "LGBTQ_PLUS", label: "LGBTQ+" },
                    ]} selected={gender} onChange={setGender} />
                    <StoryChipGroup label="ชั้นปี" options={[
                        { value: "1", label: "ปี 1" },
                        { value: "2", label: "ปี 2" },
                        { value: "3", label: "ปี 3" },
                        { value: "4", label: "ปี 4" },
                    ]} selected={yearLevel} onChange={setYearLevel} />
                    <StoryChipGroup label="รายได้ครอบครัว" options={[
                        { value: "UNDER_100K", label: "< 100K" },
                        { value: "BETWEEN_100K_200K", label: "100-200K" },
                        { value: "BETWEEN_200K_300K", label: "200-300K" },
                        { value: "BETWEEN_300K_500K", label: "300-500K" },
                        { value: "BETWEEN_500K_800K", label: "500-800K" },
                        { value: "OVER_1M", label: "> 1M" },
                    ]} selected={income} onChange={setIncome} />
                    <StoryChipGroup label="สถานะครอบครัว" options={[
                        { value: "TOGETHER", label: "พ่อแม่อยู่ด้วยกัน" },
                        { value: "DIVORCED", label: "หย่าร้าง" },
                        { value: "FATHER_DECEASED", label: "บิดาเสีย" },
                        { value: "MOTHER_DECEASED", label: "มารดาเสีย" },
                        { value: "SINGLE_PARENT", label: "เลี้ยงเดี่ยว" },
                    ]} selected={parental} onChange={setParental} />
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
                    <StoryChipGroup label="ประเภทการปรึกษา" options={[
                        { value: "ONLINE", label: "ออนไลน์" },
                        { value: "ONSITE", label: "ออนไซต์" },
                    ]} selected={service} onChange={setService} />
                </StoryFilterStack>
            }
            datePreset={date}
            dataRange={meta?.dataRange}
            customRange={customRange}
            delay={delay}
            loading={loading}
        >
            {data && trendData.length > 0 && (
                <div className="mt-1">
                    <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">
                        {isYearly ? "แนวโน้มรายปี" : "แนวโน้มรายเดือน"}
                    </p>
                    <ResponsiveContainer width="100%" height={isYearly ? 240 : 200}>
                        <BarChart data={trendData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#f1f5f9"} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: theme === "dark" ? "#94a3b8" : "#94a3b8" }}
                                angle={isYearly ? 0 : -45} textAnchor={isYearly ? "middle" : "end"}
                                height={isYearly ? 30 : 55} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: theme === "dark" ? "#64748b" : "#94a3b8" }} width={55}
                                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} axisLine={false} tickLine={false} />
                            <Tooltip content={<Tip />} cursor={{ fill: theme === "dark" ? "#1e293b" : "#f8fafc" }} />
                            <Legend verticalAlign="bottom" iconType="circle"
                                formatter={(v: string) => <span className="text-xs text-slate-500 font-medium">{v}</span>} />
                            <Bar dataKey="จอง" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="มาจริง" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {data && trendData.length === 0 && (
                <div className="h-32 flex items-center justify-center text-slate-300 text-sm">
                    ยังไม่มีข้อมูลแนวโน้ม
                </div>
            )}
        </DataStoryCard>
    );
}

