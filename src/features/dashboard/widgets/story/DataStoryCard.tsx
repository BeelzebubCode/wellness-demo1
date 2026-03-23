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
}: Props) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const hasFilters = !!filters;
    const hasHeaderMeta = hasFilters || !!headerBadge || !!datePreset;

    const dateBadge = datePreset ? (
        <DataRangeBadge preset={datePreset} dataRange={dataRange} customRange={customRange} />
    ) : null;

    return (
        <div
            className={`
                animate-[fadeUp_0.5s_ease-out_both] group relative
                h-full flex flex-col
                bg-white rounded-2xl border border-slate-200
                shadow-sm hover:shadow-lg transition-all duration-500
                overflow-hidden
                ${className ?? ""}
            `}
            style={{ animationDelay: `${delay * 100}ms` }}
        >
            <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4 min-w-0">
                        <div
                            className={`
                                shrink-0 p-2.5 rounded-xl flex items-center justify-center
                                ${iconGradient ?? "bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm"}
                            `}
                        >
                            {icon}
                        </div>
                        <div className="min-w-0 pt-0.5">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                                {title}
                            </h3>
                            {description && (
                                <p className="text-sm font-medium text-slate-500 mt-0.5 leading-snug">
                                    {description}
                                </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1.5 leading-snug line-clamp-2">
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
                                        ${filtersOpen
                                            ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200"
                                        }
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
                    <div className="flex flex-wrap gap-2 mt-3">
                        {kpis.map((kpi, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100"
                            >
                                <span
                                    className="text-lg font-black tabular-nums leading-none"
                                    style={{ color: kpi.color ?? "#4f46e5" }}
                                >
                                    {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
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
                        transition-all duration-300 ease-in-out overflow-hidden border-t border-slate-50
                        ${filtersOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-transparent"}
                    `}
                >
                    <div className="px-5 py-3 bg-slate-50/50">{filters}</div>
                </div>
            )}

            <div className="px-5 pb-5 flex-1 flex flex-col justify-center">
                {loading ? (
                    <div className="h-full min-h-[12rem] w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl animate-pulse" />
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
