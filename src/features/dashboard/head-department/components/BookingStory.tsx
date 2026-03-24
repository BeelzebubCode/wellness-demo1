// src/features/dashboard/head-department/components/BookingStory.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Card 2: การใช้บริการให้คำปรึกษา — booking trend + KPIs
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, useMemo } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CalendarCheck } from "lucide-react";
import { DataStoryCard } from "../../widgets/story/DataStoryCard";
import { StoryChipGroup, StoryFilterStack } from "../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "./StoryUI";
import { useStoryData, Tip, MONTH_LABEL, type DatePreset, type DateRange } from "./story-utils";

export default function BookingStory({ delay = 0 }: { delay?: number }) {
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [status, setStatus] = useState<string[]>([]);
    const [attendance, setAttendance] = useState<string[]>([]);
    const [service, setService] = useState<string[]>([]);
    const [advisorId, setAdvisorId] = useState<string[]>([]);
    const { data, loading, advisors, dataRange } = useStoryData<any>("bookings", {
        booking_status: status, attendance_status: attendance, service_mode: service,
        advisorId,
    }, date, customRange);

    const trend = useMemo(() =>
        (data?.monthlyTrend ?? []).map((d: any) => {
            const parts = (d.month || "").split("-");
            const mm = parts.length > 1 ? parts[1] : parts[0];
            return {
                month: MONTH_LABEL[mm] ?? mm,
                การจอง: Number(d.bookings || 0),
                เช็คอิน: Number(d.checkedIn || 0)
            };
        }), [data?.monthlyTrend]);

    return (
        <DataStoryCard
            icon={<CalendarCheck className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-cyan-500 to-teal-600"
            title="การใช้บริการให้คำปรึกษา"
            description="ติดตามปริมาณการจองนัดหมายปรึกษา อัตราการเข้าพบจริง (Check-in) และแนวโน้มความต้องการในแต่ละช่วงเวลา — ใช้เพื่อบริหารจัดการทรัพยากรอาจารย์ที่ปรึกษาให้เพียงพอต่อความต้องการ และระบุช่วงเวลาที่มีนิสิตขอรับบริการสูง"
            narration={
                data ? `จองทั้งหมด ${data.totalBookings || 0} ครั้ง — เช็คอิน ${data.checkedInCount || 0} (${(data.totalBookings || 0) > 0 ? Math.round((data.checkedInCount || 0) / (data.totalBookings || 0) * 100) : 0}%)`
                    : "กำลังโหลด..."
            }
            kpis={data ? [
                { label: "จอง", value: data.totalBookings || 0, color: "#06b6d4" },
                { label: "เช็คอิน", value: data.checkedInCount || 0, color: "#10b981" },
                { label: "เสร็จ", value: data.completedCount || 0, color: "#8b5cf6" },
                { label: "ไม่มา", value: data.noShowCount || 0, color: "#f59e0b" },
            ] : undefined}
            filters={
                <StoryFilterStack>
                    <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={dataRange} />
                    <StoryChipGroup label="สถานะ" options={[
                        { value: "PENDING_ASSIGNMENT", label: "รอ" },
                        { value: "CONFIRMED", label: "ยืนยัน" },
                        { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
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
            {trend.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trend} margin={{ left: -15, right: 8 }}>
                        <defs>
                            <linearGradient id="aB" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="aC" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<Tip />} />
                        <Legend iconType="circle" formatter={(v: string) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>} />
                        <Area type="monotone" dataKey="การจอง" stroke="#4f46e5" strokeWidth={2} fill="url(#aB)" dot={{ r: 2, fill: "#4f46e5" }} />
                        <Area type="monotone" dataKey="เช็คอิน" stroke="#10b981" strokeWidth={2} fill="url(#aC)" dot={{ r: 2, fill: "#10b981" }} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </DataStoryCard>
    );
}
