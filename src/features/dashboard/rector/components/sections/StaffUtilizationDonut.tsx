"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Loader2, ArrowRight } from "lucide-react";
import { RectorDashboardFilters } from "../../types";

const API = "/api/v2/dashboards/rector/story";

const DONUT_COLORS = ["#6366f1", "#f97316"];

interface Props {
    globalFilters?: RectorDashboardFilters;
}

export default function StaffUtilizationDonut({ globalFilters }: Props) {
    const [data, setData] = useState<{ internal: number; borrowed: number } | null>(null);
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
                if (json.data?.staffUtilization) {
                    setData(json.data.staffUtilization);
                } else {
                    setData(null);
                }
            } catch (error) {
                console.error("Failed to fetch staff utilization data:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [globalFilters]);

    const total = (data?.internal ?? 0) + (data?.borrowed ?? 0);
    const chartData = [
        { name: "บุคลากรภายใน", value: data?.internal ?? 0 },
        { name: "ยืมตัว", value: data?.borrowed ?? 0 },
    ];

    const pctInternal = total > 0 ? Math.round(((data?.internal ?? 0) / total) * 100) : 0;
    const pctBorrowed = total > 0 ? Math.round(((data?.borrowed ?? 0) / total) * 100) : 0;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 grid place-items-center shadow-lg shadow-orange-200">
                    <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">การใช้บุคลากรจิตแพทย์</h2>
                    <p className="text-xs text-slate-400">สัดส่วนภาระงาน: ภายในมหาวิทยาลัย vs ผู้เชี่ยวชาญยืมตัว</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
                    <span className="text-sm font-medium text-slate-400">กำลังประมวลผล...</span>
                </div>
            ) : total === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300 bg-slate-25 rounded-xl border border-dashed border-slate-100">
                    <Users className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">ยังไม่มีข้อมูลการมอบหมาย</p>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="w-full sm:w-[45%] h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    strokeWidth={0}
                                >
                                    {chartData.map((_, idx) => (
                                        <Cell key={idx} fill={DONUT_COLORS[idx]} className="outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.[0]) return null;
                                        return (
                                            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-xl text-xs">
                                                <p className="font-bold text-slate-800 mb-1">{payload[0].name}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                                                    <p className="text-slate-600 font-semibold">{payload[0].value.toLocaleString()} งาน</p>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-slate-800">{total.toLocaleString()}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">เคสทั้งหมด</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div className="group cursor-default p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-25 transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: DONUT_COLORS[0] }} />
                                    <span className="text-sm font-semibold text-slate-700">บุคลากรภายใน</span>
                                </div>
                                <span className="text-sm font-black text-slate-800">{pctInternal}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pctInternal}%`, background: DONUT_COLORS[0] }} />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{data?.internal?.toLocaleString() || 0} ครั้ง</p>
                        </div>

                        <div className="group cursor-default p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-25 transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: DONUT_COLORS[1] }} />
                                    <span className="text-sm font-semibold text-slate-700">ยืมตัว (Borrowed)</span>
                                </div>
                                <span className="text-sm font-black text-slate-800">{pctBorrowed}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pctBorrowed}%`, background: DONUT_COLORS[1] }} />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{data?.borrowed?.toLocaleString() || 0} ครั้ง</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
