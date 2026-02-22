// src/components/admin/schedule/ScheduleCalendar.tsx
'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ScheduleCalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (newMonth: Date) => void;
}

// Helper functions
function getCalendarDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: Date[] = [];

  // Add days from previous month
  const startDay = firstDay.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
}

export function ScheduleCalendar({
  currentMonth,
  selectedDate,
  onDateSelect,
  onMonthChange
}: ScheduleCalendarProps) {
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const changeMonth = (offset: number) => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset));
  };

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-slate-800">
          {formatMonthYear(currentMonth)}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((d, i) => (
          <div
            key={d}
            className={cn(
              'text-center text-[10px] font-medium py-1',
              i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const dayOfWeek = date.getDay();

          return (
            <button
              key={i}
              onClick={() => onDateSelect(date)}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-xs transition-all font-medium',
                !isCurrentMonth && 'text-slate-300',
                isCurrentMonth && !isSelected && !isTodayDate && (
                  dayOfWeek === 0 ? 'text-rose-500 hover:bg-rose-50' :
                    dayOfWeek === 6 ? 'text-blue-500 hover:bg-blue-50' :
                      'text-slate-700 hover:bg-slate-100'
                ),
                isTodayDate && !isSelected && 'ring-2 ring-primary-500 bg-primary-50 text-primary-500',
                isSelected && 'bg-primary-500 text-white shadow-md hover:bg-primary-600'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Go to Today */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => {
            const today = new Date();
            onMonthChange(today);
            onDateSelect(today);
          }}
          className="w-full py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
        >
          ไปวันนี้
        </button>
      </div>
    </div>
  );
}

export default ScheduleCalendar;