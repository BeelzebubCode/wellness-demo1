// src/features/dashboard/shared/SummaryKPICards.tsx
"use client";

import React from "react";
import { CalendarCheck2, XCircle, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import type { SummaryStats } from "../types/analytics-types";

function KPICard({
    icon: Icon,
    label,
    value,
    sub,
    colorFrom,
    colorTo,
    iconColor,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    colorFrom: string;
    colorTo: string;
    iconColor: string;
}) {
    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${colorFrom} ${colorTo} rounded-2xl p-5 shadow-lg border border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group`}>
            {/* Background pattern for depth */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500 pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-20 h-20 bg-black/5 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/90 tracking-wide">{label}</p>
                    <div className={`w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                </div>
                <div>
                    <p className="text-3xl font-black text-white drop-shadow-sm">{value}</p>
                    {sub && <p className="text-xs font-medium text-white/80 mt-1 bg-black/10 inline-block px-2 py-0.5 rounded-full backdrop-blur-sm">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

export function SummaryKPICards({
    data,
    loading,
}: {
    data: SummaryStats | null;
    loading?: boolean;
}) {
    if (loading || !data) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[140px] bg-white/40 backdrop-blur-md rounded-2xl animate-pulse shadow-sm border border-white/50" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
                icon={CalendarCheck2}
                label="การจองทั้งหมด"
                value={data.totalBookings.toLocaleString()}
                colorFrom="from-blue-500"
                colorTo="to-indigo-600"
                iconColor="text-white"
            />
            <KPICard
                icon={CheckCircle2}
                label="เข้าพบ"
                value={data.checkedInCount.toLocaleString()}
                sub={`อัตราเข้าพบ ${(data.checkedInRate * 100).toFixed(1)}%`}
                colorFrom="from-emerald-400"
                colorTo="to-teal-600"
                iconColor="text-white"
            />
            <KPICard
                icon={Clock}
                label="มาสาย"
                value={data.lateCount.toLocaleString()}
                sub={`สัดส่วน ${(data.lateRate * 100).toFixed(1)}%`}
                colorFrom="from-amber-400"
                colorTo="to-orange-500"
                iconColor="text-white"
            />
            <KPICard
                icon={AlertTriangle}
                label="ไม่มาตามนัด"
                value={data.noShowCount.toLocaleString()}
                sub={`สัดส่วน ${(data.noShowRate * 100).toFixed(1)}%`}
                colorFrom="from-rose-400"
                colorTo="to-red-600"
                iconColor="text-white"
            />
            <KPICard
                icon={XCircle}
                label="ยกเลิก"
                value={data.cancelledCount.toLocaleString()}
                sub="ถูกยกเลิกระบบ"
                colorFrom="from-slate-500"
                colorTo="to-gray-700"
                iconColor="text-white"
            />
            <KPICard
                icon={TrendingUp}
                label="ค่าเฉลี่ย Risk"
                value={data.avgRisk?.toFixed(1) ?? "—"}
                sub={`High Risk ${(data.highRiskRate * 100).toFixed(1)}%`}
                colorFrom="from-fuchsia-500"
                colorTo="to-purple-700"
                iconColor="text-white"
            />
        </div>
    );
}
