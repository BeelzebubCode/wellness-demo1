"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ArrowRight, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { 
  getCalendarDays, 
  isSameDay, 
  isToday, 
  THAI_DAYS_SHORT, 
  THAI_MONTHS, 
  toYMD, 
  fromYMD, 
  normalizeYMD,
  formatThaiDate 
} from "@/lib/date";

interface FacultyDateRangePickerProps {
    startDate?: Date;
    endDate?: Date;
    onChange: (range: { from?: Date; to?: Date }) => void;
}

export function FacultyDateRangePicker({ startDate, endDate, onChange }: FacultyDateRangePickerProps) {
    const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActivePicker(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDisplayDate = (date?: Date) => {
        if (!date) return "--/--/----";
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = (date.getFullYear() + 543).toString();
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Header / Trigger - The "Capsule" design from the image */}
            <div className="flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                {/* Start Date Button */}
                <button 
                    onClick={() => setActivePicker(activePicker === "start" ? null : "start")}
                    className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-all text-sm font-bold min-w-[150px]",
                        startDate ? "bg-white text-primary" : "bg-white text-slate-400 hover:bg-slate-50"
                    )}
                >
                    <Calendar className={cn("w-4 h-4", startDate ? "text-primary" : "text-slate-300")} />
                    <span className="tabular-nums">{formatDisplayDate(startDate)}</span>
                </button>

                {/* Arrow */}
                <div className="px-2 text-slate-300">
                    <ArrowRight className="w-4 h-4" />
                </div>

                {/* End Date Button */}
                <button 
                    onClick={() => setActivePicker(activePicker === "end" ? null : "end")}
                    className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-all text-sm font-bold min-w-[150px]",
                        endDate ? "bg-white text-primary" : "bg-white text-slate-400 hover:bg-slate-50"
                    )}
                >
                    <Calendar className={cn("w-4 h-4", endDate ? "text-primary" : "text-slate-300")} />
                    <span className="tabular-nums">{formatDisplayDate(endDate)}</span>
                </button>
            </div>

            {/* Dropdown Calendar */}
            {activePicker && (
                <div 
                    className={cn(
                        "absolute top-full mt-2 z-50 w-80 bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top",
                        activePicker === "end" ? "right-0" : "left-0"
                    )}
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">เลือกวันที่</h3>
                            <button onClick={() => setActivePicker(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <CalendarContent 
                            selectedDate={activePicker === "start" ? startDate : endDate}
                            onSelect={(date) => {
                                if (activePicker === "start") {
                                    onChange({ from: date, to: endDate });
                                } else {
                                    onChange({ from: startDate, to: date });
                                }
                            }}
                        />

                        {/* Footer */}
                        <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-5">
                            <button 
                                onClick={() => {
                                    if (activePicker === "start") onChange({ from: undefined, to: endDate });
                                    else onChange({ from: startDate, to: undefined });
                                }}
                                className="text-sm font-black text-rose-500 hover:text-rose-600 px-2"
                            >
                                ล้าง
                            </button>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => {
                                        const today = new Date();
                                        if (activePicker === "start") onChange({ from: today, to: endDate });
                                        else onChange({ from: startDate, to: today });
                                    }}
                                    className="text-sm font-black text-primary hover:text-primary/80 px-2"
                                >
                                    วันนี้
                                </button>
                                <button 
                                    onClick={() => setActivePicker(null)}
                                    className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                >
                                    <Check className="w-4 h-4" />
                                    เสร็จสิ้น
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CalendarContent({ selectedDate, onSelect }: { selectedDate?: Date, onSelect: (date: Date) => void }) {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());
    
    const days = useMemo(() => getCalendarDays(viewDate), [viewDate]);
    const monthName = THAI_MONTHS[viewDate.getMonth()];
    const yearThai = viewDate.getFullYear() + 543;

    return (
        <div className="space-y-4">
            {/* Nav */}
            <div className="flex items-center justify-between px-2">
                <button 
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                    className="p-1 text-slate-300 hover:text-slate-600 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-base font-black text-slate-800 tracking-tight">
                    {monthName} {yearThai}
                </span>
                <button 
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                    className="p-1 text-slate-300 hover:text-slate-600 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 text-center">
                {THAI_DAYS_SHORT.map((day, idx) => (
                    <span key={idx} className={cn(
                        "text-[11px] font-black uppercase tracking-wider mb-2",
                        (idx === 0 || idx === 6) ? "text-rose-400" : "text-slate-400"
                    )}>
                        {day}
                    </span>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((date, idx) => {
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                    
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect(date)}
                            className={cn(
                                "h-9 w-full flex items-center justify-center rounded-xl text-xs font-bold transition-all",
                                !isCurrentMonth && "text-slate-200",
                                isCurrentMonth && !isSelected && "text-slate-600 hover:bg-primary/10 hover:text-primary",
                                isSelected && "bg-primary text-white shadow-md shadow-primary/20"
                            )}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
