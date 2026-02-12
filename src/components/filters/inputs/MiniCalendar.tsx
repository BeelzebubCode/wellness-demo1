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
    <div className={cn("w-full", className)}>
      {/* Header: Month Navigation */}
      <div className="flex items-center justify-between mb-2 px-1"> {/* ✅ แก้ไข: ลด mb-4 เป็น mb-2 */}
        <button
          type="button"
          onClick={onPreviousMonth}
          className="p-1 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-base font-bold text-gray-900">
          {formatMonthYearTH(currentMonth)}
        </span>

        <button
          type="button"
          onClick={onNextMonth}
          className="p-1 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 mb-2 text-center gap-x-2"> {/* ✅ แก้ไข: ลด mb-3 เป็น mb-2 */}
        {THAI_DAYS_SHORT.map((d, i) => (
          <span
            key={d}
            className={cn(
              "text-[0.85rem] font-medium text-gray-400",
              (i === 0 || i === 6) && "text-red-400"
            )}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-2"> {/* ✅ แก้ไข: ลด gap-y-2 เป็น gap-y-1 (แต่คง gap-x-2 ไว้ให้กว้าง) */}
        {calendarDays.map((date, idx) => {
          const selected = isSameDay(date, selectedDate);
          const today = isToday(date);
          const disabled = isDateDisabled(date);
          const inMonth = isCurrentMonth(date);

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelectDate(date)}
              className={cn(
                "relative h-9 w-full rounded-lg flex items-center justify-center text-sm transition-all duration-200", // ✅ แก้ไข: ลด h-10 เป็น h-9

                // Normal State
                inMonth && !disabled && !selected && "text-gray-700 hover:bg-primary-50 hover:text-primary-600",

                // Ghost State (Out of month)
                !inMonth && !disabled && "text-gray-300 hover:text-gray-400",

                // Disabled
                disabled && "text-gray-300 opacity-40 cursor-not-allowed",

                // Selected
                selected && "bg-primary-600 text-white shadow-md shadow-primary-200 font-semibold hover:bg-primary-700",

                // Today
                today && !selected && "bg-primary-50 text-primary-600 font-semibold ring-1 ring-inset ring-primary-200"
              )}
            >
              <span className="z-10 relative">{date.getDate()}</span>

              {today && !selected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}