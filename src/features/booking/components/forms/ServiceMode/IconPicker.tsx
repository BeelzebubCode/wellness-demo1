// src/features/booking/components/forms/ServiceMode/IconPicker.tsx
"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Search, Check } from "lucide-react";
import { ICON_REGISTRY, type IconEntry } from "./ServiceModeIcons";

const GROUP_LABELS: Record<string, string> = {
    brand: "แบรนด์",
    communication: "สื่อสาร",
    general: "ทั่วไป",
};

export function IconPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (key: string) => void;
}) {
    const [search, setSearch] = useState("");
    const [activeGroup, setActiveGroup] = useState<string | null>(null);

    const groups = useMemo(() => {
        const map = new Map<string, { key: string; entry: IconEntry }[]>();
        for (const [key, entry] of Object.entries(ICON_REGISTRY)) {
            const q = search.toLowerCase();
            if (q && !key.includes(q) && !entry.label.toLowerCase().includes(q)) continue;
            if (activeGroup && entry.group !== activeGroup) continue;
            if (!map.has(entry.group)) map.set(entry.group, []);
            map.get(entry.group)!.push({ key, entry });
        }
        return map;
    }, [search, activeGroup]);

    return (
        <div className="space-y-3">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาไอคอน..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                />
            </div>

            {/* Group tabs */}
            <div className="flex gap-1.5 flex-wrap">
                <button
                    type="button"
                    onClick={() => setActiveGroup(null)}
                    className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        !activeGroup
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                >
                    ทั้งหมด
                </button>
                {["brand", "communication", "general"].map((g) => (
                    <button
                        key={g}
                        type="button"
                        onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all",
                            activeGroup === g
                                ? "bg-slate-800 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        {GROUP_LABELS[g]}
                    </button>
                ))}
            </div>

            {/* Icon grid */}
            <div className="max-h-[320px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-4">
                {groups.size === 0 && (
                    <p className="text-center text-sm text-slate-400 py-6">ไม่พบไอคอน</p>
                )}
                {Array.from(groups.entries()).map(([group, items]) => (
                    <div key={group}>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                            {GROUP_LABELS[group] ?? group}
                        </p>
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {items.map(({ key, entry }) => {
                                const Comp = entry.component;
                                const isSelected = value === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => onChange(key)}
                                        title={entry.label}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl",
                                            "border transition-all duration-200 cursor-pointer",
                                            isSelected
                                                ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200 shadow-sm"
                                                : "border-transparent bg-white hover:border-slate-200 hover:shadow-sm"
                                        )}
                                    >
                                        <Comp className="h-5 w-5" style={{ color: entry.color }} />
                                        <span className="text-[9px] text-slate-500 truncate max-w-full leading-tight">
                                            {entry.label}
                                        </span>
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 bg-primary-500 rounded-full p-0.5">
                                                <Check className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
