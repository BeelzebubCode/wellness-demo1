// src/features/dashboard/widgets/story/StoryFilterChips.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Light-weight inline filter chips for DataStory cards
// Renders a single row of toggle chips — no heavy filter bar
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";

export interface ChipOption {
    value: string;
    label: string;
}

interface ChipGroupProps {
    label: string;
    options: ChipOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export function StoryChipGroup({ label, options, selected, onChange }: ChipGroupProps) {
    const toggle = (val: string) => {
        onChange(
            selected.includes(val)
                ? selected.filter(v => v !== val)
                : [...selected, val]
        );
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 min-w-[50px]">
                {label}
            </span>
            <div className="flex flex-wrap gap-1.5">
                {options.map(opt => {
                    const active = selected.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => toggle(opt.value)}
                            className={`
                                px-2.5 py-1 rounded-full text-[11px] font-semibold
                                transition-all duration-200 border
                                ${active
                                    ? "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-200"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** Multiple chip groups stacked vertically */
export function StoryFilterStack({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-2 w-full min-w-0">
            {children}
        </div>
    );
}
