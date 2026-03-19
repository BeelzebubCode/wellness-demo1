// src/features/dashboard/shared/GenericBookingStory.tsx
"use client";

import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar } from "lucide-react";
import { DataStoryCard } from "../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../widgets/story/StoryFilterChips";
import { DatePresetBar, UnitToggle } from "./StoryUI";
import { useStoryData, Tip, MONTH_LABEL, type DatePreset, type DateRange, type UnitMode } from "./story-utils";

interface Props { apiPath: string; title: string; delay?: number; }

export default function GenericBookingStory({ apiPath, title, delay = 0 }: Props) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [unit, setUnit] = useState<UnitMode>("count");
    const [status, setStatus] = useState<string[]>([]);
    const [attendance, setAttendance] = useState<string[]>([]);
    const [service, setService] = useState<string[]>([]);
    const [deptIds, setDeptIds] = useState<string[]>([]);

    const { data, loading, meta } = useStoryData<any>(apiPath, "bookings", {
        booking_status: status,
        attendance_status: attendance,
        service_mode: service,
        department_ids: deptIds,
    }, date, customRange);

    const total = data?.totalBookings ?? 0;
    const checkedIn = data?.checkedInCount ?? 0;
    const noShow = data?.noShowCount ?? 0;
    const completed = data?.completedCount ?? 0;

    const trendData = (data?.monthlyTrend ?? []).map((m: any) => ({
        month: MONTH_LABEL[m.month?.split("-")[1]] || m.month,
        จอง: m.bookings,
        มาจริง: m.checkedIn,
    }));

    return (
        <DataStoryCard
            icon={<Calendar className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            title={title}
            narration={
                data ? `การนัดหมายทั้งหมด ${total} ครั้ง — มาตามนัด ${checkedIn} ครั้ง / ไม่มา ${noShow} ครั้ง / สำเร็จ ${completed} ครั้ง`
                    : "กำลังโหลด..."
            }
            kpis={data ? [
                { label: "นัดหมายรวม", value: total, color: "#059669" },
                { label: "มาตามนัด", value: checkedIn, color: "#10b981" },
                { label: "ไม่มา", value: noShow, color: "#f43f5e" },
                { label: "สำเร็จ", value: completed, color: "#4f46e5" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <div className="flex items-center justify-between gap-3">
                        <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} />
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
            delay={delay}
            loading={loading}
        >
            {data && trendData.length > 0 && (
                <div className="mt-1">
                    <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">แนวโน้มรายเดือน</p>
                    <ResponsiveContainer width="100%" height={180}>
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
            {data && trendData.length === 0 && (
                <div className="h-32 flex items-center justify-center text-slate-300 text-sm">
                    ยังไม่มีข้อมูลแนวโน้ม
                </div>
            )}
        </DataStoryCard>
    );
}
