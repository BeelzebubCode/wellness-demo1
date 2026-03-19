// src/features/dashboard/widgets/story/DataStoryCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Self-contained DataStory card — one card tells one story
// Header + KPI chips + chart body + collapsible filters with label
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState, type ReactNode } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

export interface StoryKpi {
    label: string;
    value: number | string;
    color?: string;           // chip border/text color
}

interface Props {
    /** Story icon (emoji or Lucide component) */
    icon: ReactNode;
    /** Gradient class for the icon circle */
    iconGradient?: string;
    /** Story title  */
    title: string;
    /** Short explanation of what this card measures and its purpose */
    description?: string;
    /** DataStory narration — one-sentence explanation */
    narration: string;
    /** KPI chips rendered below the header */
    kpis?: StoryKpi[];
    /** Inline filters — collapsible */
    filters?: ReactNode;
    /** Badge shown below filter toggle button (top-right, always visible) */
    headerBadge?: ReactNode;
    /** Card body — charts / visualisations */
    children: ReactNode;
    /** Grid col-span class */
    className?: string;
    /** Stagger animation delay index */
    delay?: number;
    /** Loading state */
    loading?: boolean;
}

export function DataStoryCard({
    icon, iconGradient, title, description, narration, kpis, filters, headerBadge,
    children, className, delay = 0, loading,
}: Props) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const hasFilters = !!filters;

    return (
        <div
            className={`
                animate-[fadeUp_0.5s_ease-out_both] group relative
                h-full flex flex-col
                bg-white rounded-2xl border border-slate-100
                shadow-sm hover:shadow-lg transition-all duration-500
                overflow-hidden
                ${className ?? ""}
            `}
            style={{ animationDelay: `${delay * 100}ms` }}
        >
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        {/* Icon */}
                        <div className={`
                            shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg
                            ${iconGradient ?? "bg-gradient-to-br from-indigo-500 to-violet-500"}
                            text-white shadow-sm
                        `}>
                            {icon}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-extrabold text-slate-800 leading-tight">
                                {title}
                            </h3>
                            {description && (
                                <p className="text-[12.5px] font-medium text-slate-500 mt-1 mb-0.5 leading-snug">
                                    {description}
                                </p>
                            )}
                            <p className="text-[12px] text-slate-400 leading-snug line-clamp-2">
                                {narration}
                            </p>
                        </div>
                    </div>

                    {/* Filter toggle button — top-right with label */}
                    {hasFilters && (
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
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
                                {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {headerBadge}
                        </div>
                    )}
                </div>

                {/* ── KPI Chips ─────────────────────────────────────── */}
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

            {/* ── Filters (Collapsible with label) ─────────────── */}
            {hasFilters && (
                <div className={`
                    transition-all duration-300 ease-in-out overflow-hidden border-t border-slate-50
                    ${filtersOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-transparent"}
                `}>
                    <div className="px-5 py-3 bg-slate-50/50">
                        {filters}
                    </div>
                </div>
            )}

            {/* ── Body ─────────────────────────────────────────────── */}
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
