// src/features/dashboard/rector/components/stories/RectorStoryUI.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Hash, Percent, GraduationCap, X } from "lucide-react";
import { fetchFaculties } from "../../../widgets/api/analytics-api";
import { FacultyOption } from "../../../widgets/types/analytics-types";

// --- Date Presets ---
export type DatePreset = "month" | "3m" | "6m" | "year" | "all" | "custom";
export interface DateRange { start: string; end: string; }

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: "month", label: "เดือนนี้" },
    { value: "3m", label: "3 เดือน" },
    { value: "6m", label: "6 เดือน" },
    { value: "year", label: "ปีนี้" },
    { value: "all", label: "ทั้งหมด" },
    { value: "custom", label: "กำหนดเอง" },
];

export function DatePresetBar({
    value,
    onChange,
    customRange,
    onCustomRangeChange
}: {
    value: DatePreset;
    onChange: (v: DatePreset) => void;
    customRange?: DateRange;
    onCustomRangeChange?: (r: DateRange) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {DATE_PRESETS.map(p => (
                <button
                    key={p.value}
                    onClick={() => onChange(p.value)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${value === p.value
                            ? "bg-indigo-500 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    {p.value === "custom" && <Calendar className="w-3 h-3 inline-block mr-0.5 -mt-px" />}
                    {p.label}
                </button>
            ))}
            {value === "custom" && onCustomRangeChange && (
                <div className="flex items-center gap-1.5 ml-1 animate-in fade-in slide-in-from-left-2 duration-300">
                    <input
                        type="date"
                        value={customRange?.start ?? ""}
                        onChange={e => onCustomRangeChange({
                            start: e.target.value,
                            end: customRange?.end ?? new Date().toISOString().split("T")[0],
                        })}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">ถึง</span>
                    <input
                        type="date"
                        value={customRange?.end ?? ""}
                        onChange={e => onCustomRangeChange({
                            start: customRange?.start ?? "2024-01-01",
                            end: e.target.value,
                        })}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                </div>
            )}
        </div>
    );
}

// --- Faculty Multi-Select ---
export function FacultyChipGroup({
    selectedIds,
    onChange
}: {
    selectedIds: number[];
    onChange: (ids: number[]) => void;
}) {
    const [faculties, setFaculties] = useState<FacultyOption[]>([]);

    useEffect(() => {
        fetchFaculties().then(setFaculties).catch(() => { });
    }, []);

    const toggle = (id: number) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter(x => x !== id)
            : [...selectedIds, id];
        onChange(next);
    };

    if (faculties.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">คณะ</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {faculties.map(f => (
                    <button
                        key={f.facultyId}
                        onClick={() => toggle(f.facultyId)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 border ${selectedIds.includes(f.facultyId)
                                ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                            }`}
                    >
                        {f.facultyNameTh}
                        {selectedIds.includes(f.facultyId) && <X className="w-2.5 h-2.5 inline-block ml-1 opacity-60" />}
                    </button>
                ))}
            </div>
        </div>
    );
}

// --- Date Range Helper ---
export function getDateParams(preset: DatePreset, custom?: DateRange) {
    if (preset === "all") return { all_time: true };
    if (preset === "custom" && custom) return { date_start: custom.start, date_end: custom.end, all_time: false };

    const now = new Date();
    const end = now.toISOString().split("T")[0];
    let start: Date;
    switch (preset) {
        case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "3m": start = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
        case "year": start = new Date(now.getFullYear(), 0, 1); break;
        default: start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { date_start: start.toISOString().split("T")[0], date_end: end, all_time: false };
}
