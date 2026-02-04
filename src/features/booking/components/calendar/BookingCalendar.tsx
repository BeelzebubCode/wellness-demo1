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
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.getMonth();

  const body = (
    <div className={cn(!embedded && "overflow-hidden")}>
      <div
        className={cn(
          "flex items-center justify-between border-b border-gray-100",
          embedded ? "px-4 py-4" : "p-4",
        )}
      >
        <button
          type="button"
          onClick={() => startTransition(onPreviousMonth)}
          disabled={isPending}
          className={cn(
            "p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600",
            isPending && "opacity-60 cursor-not-allowed",
          )}
          aria-label="เดือนก่อนหน้า"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-xl font-semibold text-gray-800">
          {formatMonthYear(currentMonth)}
        </h3>

        <button
          type="button"
          onClick={() => startTransition(onNextMonth)}
          disabled={isPending}
          className={cn(
            "p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600",
            isPending && "opacity-60 cursor-not-allowed",
          )}
          aria-label="เดือนถัดไป"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className={cn(embedded ? "px-4 py-4" : "p-4")}>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {THAI_DAYS_SHORT.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const selected = isSameDay(date, selectedDate);
            const today = isToday(date);
            const disabled = isDateDisabled(date) || isPast(date);
            const inMonth = isCurrentMonth(date);

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
                  "aspect-square flex items-center justify-center rounded-lg text-sm",
                  "transition-all duration-200",
                  !inMonth && "text-gray-300",
                  inMonth && !disabled && "text-gray-700 hover:bg-gray-50",
                  selected && "bg-primary-500 text-white hover:bg-primary-600 shadow-md",
                  today && !selected && "ring-2 ring-primary-500 ring-inset font-bold text-primary-600",
                  (disabled || isPending) && "text-gray-300 cursor-not-allowed hover:bg-transparent",
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
  return <Card className="overflow-hidden">{body}</Card>;
}
