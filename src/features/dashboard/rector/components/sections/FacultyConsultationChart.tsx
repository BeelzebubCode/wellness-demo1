"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { RectorDashboardFilters } from "../../types";

const COLORS = [
    "#7c3aed", "#6366f1", "#3b82f6", "#06b6d4",
    "#14b8a6", "#22c55e", "#eab308", "#f97316",
    "#ef4444", "#ec4899", "#8b5cf6", "#a855f7",
];

interface FacBooking {
    id: number;
    nameTh: string;
    code: string;
    count: number;
}

const API = "/api/v2/dashboards/rector/story";

interface Props {
    globalFilters?: RectorDashboardFilters;
}

export default function FacultyConsultationChart({ globalFilters }: Props) {
    const router = useRouter();
    const [data, setData] = useState<FacBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append("story", "departments");
                
                if (globalFilters) {
                    if (globalFilters.startDate) params.append("start_date", globalFilters.startDate.toISOString().split('T')[0]);
                    if (globalFilters.endDate) params.append("end_date", globalFilters.endDate.toISOString().split('T')[0]);
                    if (globalFilters.facultyId) params.append("faculty_ids", globalFilters.facultyId.toString());
                    if (globalFilters.departmentId) params.append("department_ids", globalFilters.departmentId.toString());
                    if (globalFilters.problemCategoryId) params.append("problem_category_ids", globalFilters.problemCategoryId.toString());
                    if (globalFilters.gender) params.append("gender", globalFilters.gender);
                }

                if (!globalFilters?.startDate) {
                    params.append("all_time", "true");
                }

                const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (json.data?.facultyBookings) {
                    setData(json.data.facultyBookings);
                } else {
                    setData([]);
                }
            } catch (error) {
                console.error("Failed to fetch faculty consultation data:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [globalFilters]);

    const sorted = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);
    const maxCount = Math.max(...sorted.map(d => d.count), 1);

    const handleClick = (entry: FacBooking) => {
        router.push(`/dean?faculty=${entry.id}`);
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: "100ms" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 grid place-items-center shadow-lg shadow-purple-200">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">จำนวนครั้งปรึกษาจิตแพทย์ แยกตามคณะ</h2>
                        <p className="text-xs text-slate-400">ภาพรวมการเข้ารับบริการรายคณะ • กดที่แท่งเพื่อดูรายละเอียด</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-xs font-bold text-slate-500">รวมทั้งหมด: </span>
                    <span className="text-sm font-black text-purple-600">{data.reduce((acc, curr) => acc + curr.count, 0).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 ml-1">ครั้ง</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-25 rounded-xl border border-dashed border-slate-100">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                    <span className="text-sm font-medium text-slate-400">กำลังประมวลผลข้อมูล...</span>
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300 bg-slate-25 rounded-xl border border-dashed border-slate-100">
                    <GraduationCap className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">ไม่พบข้อมูลในช่วงเวลาหรือเงื่อนไขที่เลือก</p>
                </div>
            ) : (
                <div className="h-[400px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 60, left: 20, bottom: 5 }}>
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                                type="number" 
                                tick={{ fontSize: 11, fill: "#94a3b8" }} 
                                axisLine={false}
                                tickLine={false}
                                domain={[0, Math.ceil(maxCount * 1.15)]} 
                            />
                            <YAxis 
                                type="category" 
                                dataKey="nameTh" 
                                width={160} 
                                tick={{ fontSize: 13, fill: "#475569", fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc', radius: 8 }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const d = payload[0].payload as FacBooking;
                                    return (
                                        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-2xl text-xs min-w-[180px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-4 rounded-full bg-purple-500" />
                                                <p className="font-bold text-slate-800 text-sm">{d.nameTh}</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-slate-500 flex justify-between">
                                                    <span>จำนวนการปรึกษา:</span>
                                                    <span className="font-bold text-purple-600 ml-2">{d.count.toLocaleString()} ครั้ง</span>
                                                </p>
                                                <div className="pt-2 border-t border-slate-100">
                                                    <p className="text-[10px] text-indigo-500 font-semibold italic text-center">คลิกเพื่อเข้าสู่หน้าแดชบอร์ดคณะ</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <Bar 
                                dataKey="count" 
                                radius={[0, 10, 10, 0]} 
                                barSize={24}
                                cursor="pointer" 
                                onClick={(_: any, idx: number) => handleClick(sorted[idx])}
                            >
                                {sorted.map((_, idx) => (
                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} className="transition-all hover:opacity-80 active:scale-[0.98]" />
                                ))}
                                <LabelList 
                                    dataKey="count" 
                                    position="right" 
                                    formatter={(v: any) => Number(v).toLocaleString()}
                                    style={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }} 
                                    offset={12}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
