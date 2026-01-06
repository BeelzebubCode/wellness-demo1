// src/components/shared/Calendar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CalendarProps {
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  highlightedDates?: Date[];
  disabledDates?: Date[];
  className?: string;
}

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isDateInArray(date: Date, dates: Date[]): boolean {
  return dates.some((d) => isSameDay(date, d));
}

export function Calendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  highlightedDates = [],
  disabledDates = [],
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const today = useMemo(() => new Date(), []);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const result: (Date | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
      result.push(null);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(new Date(year, month, i));
    }

    return result;
  }, [currentMonth]);

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (isDateInArray(date, disabledDates)) return true;
    return false;
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="font-semibold text-slate-900">
          {MONTHS_TH[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_TH.map((day, i) => (
          <div
            key={day}
            className={cn(
              'text-center text-xs font-medium py-2',
              i === 0 ? 'text-red-500' : 'text-slate-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const isHighlighted = isDateInArray(date, highlightedDates);
          const disabled = isDateDisabled(date);
          const isSunday = date.getDay() === 0;

          return (
            <button
              key={date.toISOString()}
              onClick={() => !disabled && onDateSelect?.(date)}
              disabled={disabled}
              className={cn(
                'aspect-square flex items-center justify-center text-sm rounded-lg transition-all relative',
                disabled && 'opacity-40 cursor-not-allowed',
                !disabled && 'hover:bg-slate-100',
                isSelected && 'bg-emerald-500 text-white hover:bg-emerald-600',
                !isSelected && isToday && 'ring-2 ring-emerald-500 ring-inset',
                !isSelected && !isToday && isSunday && 'text-red-500',
                !isSelected && !isToday && !isSunday && 'text-slate-700'
              )}
            >
              {date.getDate()}
              {isHighlighted && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;