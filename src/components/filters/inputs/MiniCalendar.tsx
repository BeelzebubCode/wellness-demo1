"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  className?: string;
};

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  minDate,
  maxDate,
  disablePast,
  className,
}: MiniCalendarProps) {
  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear();

  const isDateDisabled = (date: Date) => {
    // ✅ compare normalized to start of day (ignore time)
    const d = startOfDay(date);
    if (minDate && d < startOfDay(minDate)) return true;
    if (maxDate && d > startOfDay(maxDate)) return true;
    if (disablePast && isPast(date)) return true;
    return false;
  };

  return (
    <div className={cn("w-full bg-white", className)}>
      {/* Header: Month Navigation */}
      <div className="flex items-center justify-between mb-6 px-1">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all duration-300 shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-base font-black text-slate-800 tracking-tight">
          {formatMonthYearTH(currentMonth)}
        </span>

        <button
          type="button"
          onClick={onNextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all duration-300 shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 mb-4 text-center">
        {THAI_DAYS_SHORT.map((d, i) => (
          <span
            key={d}
            className={cn(
              "text-[10px] font-black text-slate-300 uppercase tracking-widest",
              (i === 0 || i === 6) && "text-rose-300"
            )}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1">
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
                  "relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",

                  // Normal State
                  inMonth && !disabled && !selected && "text-slate-600 hover:bg-slate-50 hover:text-primary",

                  // Ghost State (Out of month)
                  !inMonth && !disabled && "text-slate-200",

                  // Disabled
                  disabled && "text-slate-200 cursor-not-allowed",

                  // Selected
                  selected && "bg-primary text-white shadow-lg shadow-primary/30 scale-110",

                  // Today
                  today && !selected && "text-primary border-2 border-primary/20"
                )}
              >
                <span className="relative z-10">{date.getDate()}</span>
                {today && !selected && (
                  <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
