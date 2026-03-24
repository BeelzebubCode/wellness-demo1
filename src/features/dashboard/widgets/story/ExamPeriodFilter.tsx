// src/features/dashboard/widgets/story/ExamPeriodFilter.tsx
"use client";

import React from "react";
import { Target, BarChart2 } from "lucide-react";

export interface ExamPeriodOption {
    value: string;
    label: string;
    date: string;
    type: "midterm" | "final";
}

const EXAM_PERIODS: ExamPeriodOption[] = [
    { value: "MIDTERM_1", label: "กลางภาค 1", date: "22-26 ก.ย.", type: "midterm" },
    { value: "FINAL_1", label: "ปลายภาค 1", date: "24 พ.ย.-8 ธ.ค.", type: "final" },
    { value: "MIDTERM_2", label: "กลางภาค 2", date: "23-27 ก.พ.", type: "midterm" },
    { value: "FINAL_2", label: "ปลายภาค 2", date: "27 เม.ย.-12 พ.ค.", type: "final" },
    { value: "FINAL_SUMMER", label: "ปลายภาค ฤดูร้อน", date: "13-17 ก.ค.", type: "final" },
];

interface ExamPeriodFilterProps {
    selected: string[];
    onChange: (selected: string[]) => void;
    onCompareClick?: () => void;
}

export function ExamPeriodFilter({ selected, onChange, onCompareClick }: ExamPeriodFilterProps) {
    const toggle = (val: string) => {
        onChange(
            selected.includes(val)
                ? selected.filter((v) => v !== val)
                : [...selected, val]
        );
    };

    return (
        <div className="flex flex-col gap-3 mt-2 mb-2 w-full min-w-0">
            <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-bold text-slate-500">ช่วงสอบ</span>
            </div>

            {/* Container for the horizontal chips with wrapping */}
            <div className="flex items-center gap-2 flex-wrap pb-1 w-full">
                {EXAM_PERIODS.map((opt) => {
                    const active = selected.includes(opt.value);
                    const isMidterm = opt.type === "midterm";

                    // Base styles depending on type
                    const baseStyle = isMidterm
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
                    
                    const activeStyle = isMidterm
                        ? "ring-2 ring-amber-500 ring-offset-1 border-amber-400 bg-amber-100"
                        : "ring-2 ring-rose-500 ring-offset-1 border-rose-400 bg-rose-100";

                    return (
                        <button
                            key={opt.value}
                            title={opt.date}
                            onClick={() => toggle(opt.value)}
                            className={`
                                flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold
                                border transition-all duration-200 whitespace-nowrap shrink-0
                                ${active ? activeStyle : baseStyle + " opacity-80"}
                            `}
                        >
                            <span>{opt.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Compare Button */}
            <div className="flex">
                <button 
                    onClick={onCompareClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-xs font-bold shadow-sm"
                >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>เปรียบเทียบช่วงสอบ</span>
                </button>
            </div>
        </div>
    );
}
