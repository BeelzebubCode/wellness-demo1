"use client";

import React, { useState, type ReactNode } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { DataRangeBadge } from "@/features/dashboard/shared/StoryUI";
import type { DatePreset, DateRange } from "@/features/dashboard/shared/story-utils";

export interface StoryKpi {
    label: string;
    value: number | string;
    color?: string;
}

interface Props {
    icon: ReactNode;
    iconGradient?: string;
    title: string;
    description?: string;
    narration: string;
    kpis?: StoryKpi[];
    filters?: ReactNode;
    headerBadge?: ReactNode;
    datePreset?: DatePreset;
    dataRange?: { minDate: string; maxDate: string } | null;
    customRange?: DateRange;
    children: ReactNode;
    className?: string;
    delay?: number;
    loading?: boolean;
    theme?: "light" | "dark";
}

export function DataStoryCard({
    icon,
    iconGradient,
    title,
    description,
    narration,
    kpis,
    filters,
    headerBadge,
    datePreset,
    dataRange,
    customRange,
    children,
    className,
    delay = 0,
    loading,
    theme = "light",
}: Props) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const hasFilters = !!filters;
    const hasHeaderMeta = hasFilters || !!headerBadge || !!datePreset;

    const dateBadge = datePreset ? (
        <DataRangeBadge preset={datePreset} dataRange={dataRange} customRange={customRange} />
    ) : null;

    const isDark = theme === "dark";

    // Theme values
    const cardBg = isDark
        ? "bg-slate-900/40 border-slate-700/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
        : "bg-white border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/5";
    
    const headerBorder = isDark ? "border-slate-800/80" : "border-slate-100/80";
    const titleColor = isDark ? "text-slate-100" : "text-slate-800";
    const descColor = isDark ? "text-slate-300" : "text-slate-500";
    const narrColor = isDark ? "text-slate-400" : "text-slate-400";
    const kpiBg = isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100/60 shadow-inner";
    const filterPanelBg = isDark ? "bg-slate-800/30 border-t-slate-800" : "bg-slate-50/30 border-t-slate-50";

    const getFilterBtnColor = () => {
        if (isDark) {
            return filtersOpen
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-700";
        }
        return filtersOpen
            ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200";
    };

    return (
        <div
            className={`
                animate-[fadeUp_0.5s_ease-out_both] group relative
                h-full flex flex-col rounded-[1.5rem] border
                hover:shadow-lg transition-all duration-500
                overflow-hidden
                ${cardBg}
                ${className ?? ""}
            `}
            style={{ animationDelay: `${delay * 100}ms` }}
        >
            <div className={`px-6 py-5 border-b ${headerBorder}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4 min-w-0">
                        <div
                            className={`
                                shrink-0 p-3.5 rounded-[1.25rem] flex items-center justify-center
                                ${iconGradient ?? (isDark ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shadow-md" : "bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm")}
                            `}
                        >
                            {icon}
                        </div>
                        <div className="min-w-0 pt-0.5">
                            <h3 className={`text-xl font-bold tracking-tight leading-tight ${titleColor}`}>
                                {title}
                            </h3>
                            {description && (
                                <p className={`text-sm font-medium mt-1 leading-snug ${descColor}`}>
                                    {description}
                                </p>
                            )}
                            <p className={`text-sm mt-2 leading-snug line-clamp-2 ${narrColor}`}>
                                {narration}
                            </p>
                        </div>
                    </div>

                    {hasHeaderMeta && (
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                            {hasFilters && (
                                <button
                                    onClick={() => setFiltersOpen(!filtersOpen)}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                                        transition-all duration-200
                                        ${getFilterBtnColor()}
                                    `}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>ตัวกรอง</span>
                                    {filtersOpen ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            )}
                            {headerBadge}
                            {dateBadge}
                        </div>
                    )}
                </div>

                {kpis && kpis.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed border-slate-200/20">
                        {kpis.map((kpi, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${kpiBg}`}
                            >
                                <span
                                    className="text-2xl font-black tabular-nums leading-none tracking-tight"
                                    style={{ color: kpi.color ?? (isDark ? "#818cf8" : "#4f46e5") }}
                                >
                                    {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                                </span>
                                <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    {kpi.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {hasFilters && (
                <div
                    className={`
                        transition-all duration-300 ease-in-out overflow-hidden border-t
                        ${filtersOpen ? `max-h-[500px] opacity-100 ${isDark ? "border-slate-800" : "border-slate-50"}` : "max-h-0 opacity-0 border-t-transparent"}
                    `}
                >
                    <div className={`px-5 py-3 ${filterPanelBg}`}>{filters}</div>
                </div>
            )}

            <div className="px-5 pb-5 flex-1 flex flex-col justify-center">
                {loading ? (
                    <div className={`h-full min-h-[12rem] w-full rounded-xl animate-pulse ${isDark ? "bg-slate-800/50" : "bg-gradient-to-br from-slate-50 to-slate-100"}`} />
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
