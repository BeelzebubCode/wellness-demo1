"use client";

import React from "react";
import { SummaryStats } from "../../widgets/types/analytics-types";
import { TrendingUp, TrendingDown, AlertTriangle, Users, Calendar, MinusCircle } from "lucide-react";

interface StrategicKPICardsProps {
    current?: SummaryStats;
    previous?: SummaryStats;
    loading?: boolean;
}

export function StrategicKPICards({ current, previous, loading }: StrategicKPICardsProps) {
    if (loading || !current) {
        return (
            <div className="w-full h-40 bg-slate-50 animate-pulse rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer" />
            </div>
        );
    }

    const calculateTrend = (curr: number, prev: number) => {
        if (!prev || prev === 0) return null;
        const diff = ((curr - prev) / prev) * 100;
        return Math.round(diff);
    };

    const TrendBadge = ({ value }: { value: number | null }) => {
        if (value === null) return null;
        const isUp = value > 0;
        const isZero = value === 0;

        return (
            <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isZero ? 'bg-slate-100 text-slate-500' :
                isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : !isZero ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                {isZero ? 'คงที่' : `${Math.abs(value)}%`}
            </div>
        );
    };

    const trend = calculateTrend(current.totalBookings, previous?.totalBookings ?? 0);

    return (
        <div className="relative group perspective-1000">
            {/* Main Premium Card */}
            <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">

                {/* Background KU Theme Accents */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] opacity-60 group-hover:opacity-80 transition-opacity duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-50 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />

                {/* Content Left: Icon & Label */}
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform duration-500">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                                ปริมาณความต้องการรับบริการรวม
                            </h2>
                            <p className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 inline-block">
                                Total Engagement Overview
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Center/Right: Big Number */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="flex items-baseline gap-4">
                        <h1 className="text-7xl md:text-8xl font-black text-slate-800 tracking-tighter drop-shadow-sm select-none">
                            {current.totalBookings.toLocaleString()}
                        </h1>
                        <div className="flex flex-col gap-2">
                            <TrendBadge value={trend} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">เคสจองทั้งหมด</span>
                        </div>
                    </div>
                </div>

                {/* Minimal Decorative Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 opacity-80" />
            </div>

            {/* Sub-label Indicator */}
            <div className="absolute -bottom-4 right-12 px-5 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 pointer-events-none z-20">
                KU Wellness Multi-Faculty Strategic Data
            </div>
        </div>
    );
}
