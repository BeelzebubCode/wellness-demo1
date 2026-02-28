// src/features/dashboard/head-department/components/StoryUI.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared UI building blocks: DatePresetBar (with custom range) + UnitToggle
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import { Hash, Percent, Calendar } from "lucide-react";
import { DATE_PRESETS, type DatePreset, type DateRange, type UnitMode } from "./story-utils";

interface DatePresetBarProps {
    value: DatePreset;
    onChange: (v: DatePreset) => void;
    customRange?: DateRange;
    onCustomRangeChange?: (r: DateRange) => void;
}

export function DatePresetBar({ value, onChange, customRange, onCustomRangeChange }: DatePresetBarProps) {
    const [showCustom, setShowCustom] = useState(value === "custom");

    const handlePresetClick = (preset: DatePreset) => {
        if (preset === "custom") {
            setShowCustom(true);
            // Set a default range if none exists (last 1 year)
            if (!customRange && onCustomRangeChange) {
                const now = new Date();
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                onCustomRangeChange({
                    start: yearAgo.toISOString().split("T")[0],
                    end: now.toISOString().split("T")[0],
                });
            }
        } else {
            setShowCustom(false);
        }
        onChange(preset);
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {DATE_PRESETS.map(p => (
                <button
                    key={p.value}
                    onClick={() => handlePresetClick(p.value)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 ${value === p.value
                            ? "bg-indigo-500 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    {p.value === "custom" && <Calendar className="w-3 h-3 inline-block mr-0.5 -mt-px" />}
                    {p.label}
                </button>
            ))}
            {/* Custom date inputs */}
            {showCustom && value === "custom" && (
                <div className="flex items-center gap-1.5 ml-1">
                    <input
                        type="date"
                        value={customRange?.start ?? ""}
                        onChange={e => onCustomRangeChange?.({
                            start: e.target.value,
                            end: customRange?.end ?? new Date().toISOString().split("T")[0],
                        })}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 bg-white focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
                    />
                    <span className="text-[10px] text-slate-400">ถึง</span>
                    <input
                        type="date"
                        value={customRange?.end ?? ""}
                        onChange={e => onCustomRangeChange?.({
                            start: customRange?.start ?? "2019-01-01",
                            end: e.target.value,
                        })}
                        className="px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 bg-white focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
                    />
                </div>
            )}
        </div>
    );
}

export function UnitToggle({ value, onChange }: { value: UnitMode; onChange: (v: UnitMode) => void }) {
    return (
        <div className="flex bg-slate-100 rounded-lg p-0.5 shrink-0">
            <button onClick={() => onChange("count")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${value === "count" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400"
                    }`}>
                <Hash className="w-3 h-3" /> จำนวน
            </button>
            <button onClick={() => onChange("percent")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${value === "percent" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400"
                    }`}>
                <Percent className="w-3 h-3" /> เปอร์เซ็นต์
            </button>
        </div>
    );
}
