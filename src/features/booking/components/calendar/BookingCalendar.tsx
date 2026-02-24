// src/features/booking/components/calendar/BookingCalendar.tsx
"use client";

import { useMemo, useTransition } from "react";
import { cn } from "@/lib/cn";
import {
  getCalendarDays,
  formatMonthYear,
  isSameDay,
  isToday,
  isPast,
  THAI_DAYS_SHORT,
} from "@/lib/date";
import { Card } from "@/components/ui";

export interface BookingCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  minDate?: Date;
  maxDate?: Date;
  embedded?: boolean;
}

export function BookingCalendar(props: BookingCalendarProps) {
  const {
    selectedDate,
    onSelectDate,
    currentMonth,
    onPreviousMonth,
    onNextMonth,
    minDate,
    maxDate,
    embedded = false,
  } = props;

  const [isPending, startTransition] = useTransition();
  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth.getMonth();

  const body = (
    <div className={cn("bg-white", !embedded && "overflow-hidden")}>
      {/* ================= Header ================= */}
      <div
        className={cn(
          "grid grid-cols-[36px_1fr_36px] items-center",
          "border-b border-gray-100",
          embedded ? "px-4 py-4" : "px-5 py-4",
        )}
      >
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => startTransition(onPreviousMonth)}
          disabled={isPending}
          className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          aria-label="เดือนก่อนหน้า"
        >
          <svg
            className="w-5 h-5 relative left-[0.5px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Month */}
        <div className="h-9 flex items-center justify-center">
          <span className="text-base md:text-lg font-bold whitespace-nowrap leading-none">
            {formatMonthYear(currentMonth)}
          </span>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => startTransition(onNextMonth)}
          disabled={isPending}
          className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          aria-label="เดือนถัดไป"
        >
          <svg
            className="w-5 h-5 relative right-[0.5px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>



      {/* ================= Calendar ================= */}
      <div className={cn(embedded ? "px-4 py-4" : "px-5 py-5")}>
        {/* Days */}
        <div className="grid grid-cols-7 mb-3">
          {THAI_DAYS_SHORT.map((day) => (
            <div
              key={day}
              className="text-center text-[16px] font-semibold text-gray-400 tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const selected = isSameDay(date, selectedDate);
            const today = isToday(date);
            const disabled = isDateDisabled(date) || isPast(date);
            const inMonth = isCurrentMonth(date);

            if (!inMonth) {
              return <div key={index} className="aspect-square" aria-hidden="true" />;
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  startTransition(() => onSelectDate(date));
                }}
                disabled={disabled || isPending}
                className={cn(
                  "aspect-square rounded-xl",
                  "flex items-center justify-center",
                  "text-sm font-medium",
                  "transition-all duration-200",

                  !disabled && "text-gray-700 hover:bg-gray-100",

                  selected &&
                  "bg-primary-500 text-white shadow-sm hover:bg-primary-600",

                  today &&
                  !selected &&
                  "border border-primary-300 text-primary-600 font-semibold",

                  (disabled || isPending) &&
                  "text-gray-300 cursor-not-allowed hover:bg-transparent",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      {body}
    </Card>
  );
}
