// src/components/filters/inputs/MiniCalendar.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getCalendarDays,
  isSameDay,
  isToday,
  isPast,
  THAI_DAYS_SHORT,
  startOfDay,
} from "@/lib/date";
import { THAI_MONTHS } from "@/lib/date";

function formatMonthYearTH(d: Date) {
  const y = d.getFullYear() + 543;
  return `${THAI_MONTHS[d.getMonth()]} ${y}`;
}

export type MiniCalendarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onJumpToMonth?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  compact?: boolean;
  className?: string;
};

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onJumpToMonth,
  minDate,
  maxDate,
  disablePast,
  compact = false,
  className,
}: MiniCalendarProps) {
  const [showYearPicker, setShowYearPicker] = useState(false);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear();

  const isDateDisabled = (date: Date) => {
    const d = startOfDay(date);
    if (minDate && d < startOfDay(minDate)) return true;
    if (maxDate && d > startOfDay(maxDate)) return true;
    if (disablePast && isPast(date)) return true;
    return false;
  };

  // Year picker: show ~10 years around current
  const currentYear = currentMonth.getFullYear();
  const yearRange = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) years.push(y);
    return years;
  }, [currentYear]);

  const handleYearSelect = (year: number) => {
    const next = new Date(year, currentMonth.getMonth(), 1);
    onJumpToMonth?.(next);
    setShowYearPicker(false);
  };

  const handleMonthSelect = (monthIdx: number) => {
    const next = new Date(currentMonth.getFullYear(), monthIdx, 1);
    onJumpToMonth?.(next);
    setShowYearPicker(false);
  };

  // Sizing classes
  const navBtn = compact
    ? "w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
    : "w-10 h-10 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 shadow-sm";
  const navIcon = compact ? "w-3.5 h-3.5" : "w-5 h-5";
  const headerText = compact ? "text-xs font-bold" : "text-base font-black";
  const dayHeaderText = compact
    ? "text-[8px] font-bold text-gray-300 uppercase tracking-wider"
    : "text-[10px] font-black text-slate-300 uppercase tracking-widest";
  const dayCellSize = compact ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-sm";

  // Year/month picker overlay
  if (showYearPicker) {
    return (
      <div className={cn("w-full bg-white", className)}>
        {/* Header */}
        <div className={cn("flex items-center justify-between mb-3 px-0.5", compact ? "mb-2" : "mb-4")}>
          <button type="button" onClick={() => setShowYearPicker(false)}
            className={cn("flex items-center transition-all duration-150", navBtn)}>
            <ChevronLeft className={navIcon} />
          </button>
          <span className={cn(headerText, "text-slate-800")}>เลือกเดือน/ปี</span>
          <button type="button" onClick={() => setShowYearPicker(false)}
            className={cn("flex items-center justify-center transition-all duration-150", navBtn)}>
            <ChevronRight className={navIcon} />
          </button>
        </div>

        {/* Year grid */}
        <div className="mb-3">
          <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5 px-0.5">ปี (พ.ศ.)</p>
          <div className="grid grid-cols-4 gap-1">
            {yearRange.map(y => (
              <button key={y} type="button" onClick={() => handleYearSelect(y)}
                className={cn(
                  "py-1.5 rounded-md text-[11px] font-semibold transition-all duration-100",
                  y === currentYear
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                )}>
                {y + 543}
              </button>
            ))}
          </div>
        </div>

        {/* Month grid */}
        <div>
          <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5 px-0.5">เดือน</p>
          <div className="grid grid-cols-3 gap-1">
            {THAI_MONTHS.map((m, i) => (
              <button key={m} type="button" onClick={() => handleMonthSelect(i)}
                className={cn(
                  "py-1.5 rounded-md text-[11px] font-semibold transition-all duration-100",
                  i === currentMonth.getMonth()
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-gray-600 hover:bg-gray-100"
                )}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full bg-white", className)}>
      {/* Header: Month Navigation */}
      <div className={cn("flex items-center justify-between px-0.5", compact ? "mb-2" : "mb-4")}>
        <button type="button" onClick={onPreviousMonth}
          className={cn("flex items-center justify-center transition-all duration-150", navBtn)}>
          <ChevronLeft className={navIcon} />
        </button>

        <button
          type="button"
          onClick={() => onJumpToMonth && setShowYearPicker(true)}
          className={cn(
            headerText, "text-slate-800 tracking-tight",
            onJumpToMonth && "hover:text-primary cursor-pointer inline-flex items-center gap-1 transition-colors"
          )}
        >
          {formatMonthYearTH(currentMonth)}
          {onJumpToMonth && <ChevronsUpDown className={compact ? "w-3 h-3 text-gray-400" : "w-3.5 h-3.5 text-gray-400"} />}
        </button>

        <button type="button" onClick={onNextMonth}
          className={cn("flex items-center justify-center transition-all duration-150", navBtn)}>
          <ChevronRight className={navIcon} />
        </button>
      </div>

      {/* Weekday Header */}
      <div className={cn("grid grid-cols-7 text-center", compact ? "mb-1.5" : "mb-3")}>
        {THAI_DAYS_SHORT.map((d, i) => (
          <span key={d} className={cn(dayHeaderText, (i === 0 || i === 6) && "text-rose-300")}>
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {calendarDays.map((date, idx) => {
          const selected = isSameDay(date, selectedDate);
          const today = isToday(date);
          const disabled = isDateDisabled(date);
          const inMonth = isCurrentMonth(date);

          return (
            <div key={idx} className="aspect-square flex items-center justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelectDate(date)}
                className={cn(
                  "relative rounded-full flex items-center justify-center font-semibold transition-all duration-150",
                  dayCellSize,
                  inMonth && !disabled && !selected && "text-slate-600 hover:bg-slate-50 hover:text-primary",
                  !inMonth && !disabled && "text-slate-200",
                  disabled && "text-slate-200 cursor-not-allowed",
                  selected && "bg-primary text-white shadow-md shadow-primary/25 scale-105",
                  today && !selected && "text-primary border border-primary/20"
                )}
              >
                <span className="relative z-10">{date.getDate()}</span>
                {today && !selected && (
                  <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
