"use client";

import React, { useState, useEffect } from "react";
import { Users, Calendar, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { RectorDashboardFilters } from "../../types";

const API = "/api/v2/dashboards/rector/story";

interface Props {
    globalFilters?: RectorDashboardFilters;
}

interface Stats {
    totalBookings: number;
    completedCount: number;
    highRiskCount: number;
}

export default function RectorStatsCards({ globalFilters }: Props) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append("story", "all");
                
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
                const d = json.data ?? {};
                
                setStats({
                    totalBookings: d.bookings?.totalBookings ?? 0,
                    completedCount: d.bookings?.completedCount ?? 0,
                    highRiskCount: d.risk?.highRiskCount ?? 0,
                });
            } catch (error) {
                console.error("Failed to fetch rector stats:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [globalFilters]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: "การนัดหมายทั้งหมด",
            value: stats?.totalBookings ?? 0,
            unit: "ครั้ง",
            icon: <Calendar className="w-5 h-5 text-indigo-500" />,
            bg: "bg-indigo-50",
            border: "border-indigo-100",
            text: "text-indigo-600",
            delay: "0ms"
        },
        {
            label: "ปรึกษาสำเร็จ",
            value: stats?.completedCount ?? 0,
            unit: "ครั้ง",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            text: "text-emerald-600",
            delay: "100ms"
        },
        {
            label: "นิสิตกลุ่มเสี่ยงสูง",
            value: stats?.highRiskCount ?? 0,
            unit: "ราย",
            icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
            bg: "bg-rose-50",
            border: "border-rose-100",
            text: "text-rose-600",
            delay: "200ms"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((card, idx) => (
                <div 
                    key={idx} 
                    className={`relative overflow-hidden group rounded-[2rem] border ${card.border} ${card.bg} p-6 transition-all duration-500 hover:shadow-lg hover:shadow-slate-200/50 animate-[fadeUp_0.5s_ease-out_both]`}
                    style={{ animationDelay: card.delay }}
                >
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        {React.cloneElement(card.icon as React.ReactElement, { className: "w-24 h-24" })}
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                {card.icon}
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-black ${card.text} tracking-tight tabular-nums`}>
                                {(card.value).toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-slate-400">{card.unit}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
