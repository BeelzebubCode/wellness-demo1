// src/features/dashboard/shared/ChartCard.tsx
"use client";

import React from "react";
import { Loader2, BarChart3 } from "lucide-react";

export function ChartCard({
    title,
    subtitle,
    loading,
    isEmpty,
    children,
    className = "",
    action,
}: {
    title: string;
    subtitle?: string;
    loading?: boolean;
    isEmpty?: boolean;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}) {
    return (
        <div
            className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}
        >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                        {title}
                    </h3>
                    {subtitle && <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 min-h-[200px] flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                        <span className="text-sm font-medium">กำลังประมวลผลข้อมูล...</span>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <BarChart3 className="w-8 h-8 text-slate-300" />
                        </div>
                        <span className="text-sm font-medium">ไม่พบข้อมูลในช่วงเวลาที่เลือก</span>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
