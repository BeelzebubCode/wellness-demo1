// src/features/dashboard/dean/components/sections/DepartmentConsultationChart.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { DataStoryCard } from "../../../widgets/story/DataStoryCard";
import { StoryFilterStack } from "../../../widgets/story/StoryFilterChips";
import { DatePresetBar } from "../../../shared/StoryUI";
import { getDateRange, type DatePreset, type DateRange } from "../../../shared/story-utils";

const COLORS = [
    "#6366f1", "#8b5cf6", "#a78bfa", "#c084fc",
    "#e879f9", "#f472b6", "#fb7185", "#f97316",
    "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

interface DeptBooking {
    id: number;
    nameTh: string;
    code: string;
    count: number;
}

const API = "/api/v2/dashboards/dean/story";

export default function DepartmentConsultationChart() {
    const router = useRouter();
    const [date, setDate] = useState<DatePreset>("all");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [deptData, setDeptData] = useState<DeptBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataRange, setDataRange] = useState<{ minDate: string; maxDate: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const sp = new URLSearchParams({ story: "departments" });
                const dr = getDateRange(date, customRange);
                if (dr.allTime) sp.set("all_time", "true");
                else {
                    if (dr.start) sp.set("date_start", dr.start);
                    if (dr.end)   sp.set("date_end",   dr.end);
                }
                const res  = await fetch(`${API}?${sp}`, { credentials: "include", cache: "no-store" });
                const json = await res.json();
                if (cancelled) return;
                setDeptData(json.data?.departmentBookings ?? []);
                if (json.data?.dataRange) setDataRange(json.data.dataRange);
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        }, 150);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [date, customRange]);
    const sorted = [...deptData].filter(d => d.count > 0).sort((a, b) => b.count - a.count);
    const maxCount = sorted.length > 0 ? Math.max(...sorted.map(d => d.count)) : 1;
    const totalCount = sorted.reduce((sum, d) => sum + d.count, 0);

    const handleClick = (entry: DeptBooking) => {
        // Navigate to dean's own subject-group page (same role)
        router.push(`/dean/subject-group?dept=${entry.id}`);
    };

    return (
        <DataStoryCard
            icon={<Building2 className="w-5 h-5" />}
            iconGradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            title="จำนวนการเข้าใช้บริการ แยกตามสาขา"
            description="ดูสัดส่วนการมาใช้บริการแยกตามภาควิชา เพื่อช่วยจัดสรรทรัพยากร ประเมินความต้องการ และพิจารณาปรับรอบคิวของนักจิตวิทยาให้เหมาะสมกับความต้องการของแต่ละสาขา"
            narration={loading ? "กำลังโหลด..." : `มีการใช้บริการทั้งหมด ${totalCount.toLocaleString()} ครั้ง จาก ${sorted.length} สาขา — สามารถคลิกที่แท่งกราฟเพื่อเจาะดูรายละเอียดของสาขานั้นได้`}
            datePreset={date}
            customRange={customRange}
            filters={
                <StoryFilterStack>
                    <DatePresetBar value={date} onChange={setDate} customRange={customRange} onCustomRangeChange={setCustomRange} dataRange={dataRange} />
                </StoryFilterStack>
            }
            delay={0}
            loading={loading}
            className="w-full"
        >
            {sorted.length > 0 ? (
                <div className="pt-2">
                    <ResponsiveContainer width="100%" height={Math.max(sorted.length * 48, 200)}>
                        <BarChart
                            data={sorted}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                domain={[0, Math.ceil(maxCount * 1.15)]}
                                tickFormatter={(v) => v.toLocaleString()}
                            />
                            <YAxis
                                type="category"
                                dataKey="nameTh"
                                width={180}
                                tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                            />
                            <Tooltip
                                cursor={{ fill: "#f8fafc" }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const d = payload[0].payload as DeptBooking;
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xl text-xs">
                                            <p className="font-bold text-slate-700 mb-1">{d.nameTh}</p>
                                            <p className="text-slate-500">
                                                ปรึกษา <span className="font-bold text-indigo-600">{d.count.toLocaleString()}</span> ครั้ง
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 italic">คลิกเพื่อดูรายละเอียดเชิงลึก</p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="count"
                                radius={[0, 8, 8, 0]}
                                cursor="pointer"
                                onClick={(_: any, idx: number) => handleClick(sorted[idx])}
                            >
                                {sorted.map((_, idx) => (
                                    <Cell
                                        key={idx}
                                        fill={COLORS[idx % COLORS.length]}
                                        className="transition-opacity hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                    {!loading && "ยังไม่มีข้อมูล"}
                </div>
            )}
        </DataStoryCard>
    );
}
