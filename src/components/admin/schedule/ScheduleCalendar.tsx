// src/components/admin/schedule/ScheduleCalendar.tsx

'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { getCalendarDays, isSameDay, isToday, formatMonthYear } from '@/lib/date';
import { cn } from '@/lib/cn';

interface ScheduleCalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (newMonth: Date) => void;
  isDirty?: boolean;
}

export function ScheduleCalendar({ 
  currentMonth, 
  selectedDate, 
  onDateSelect, 
  onMonthChange,
  isDirty 
}: ScheduleCalendarProps) {
  
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const handleDateClick = (date: Date) => {
    if (isDirty && !confirm('มีการแก้ไขที่ยังไม่บันทึก ต้องการเปลี่ยนวันหรือไม่?')) return;
    onDateSelect(date);
  };

  const changeMonth = (offset: number) => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset));
  };

  return (
    <Card className="p-0 overflow-hidden shadow-sm border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
        <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-gray-700">
          {formatMonthYear(currentMonth)}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center px-3 py-2">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
          <div key={d} className="text-[10px] font-medium text-gray-400">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {calendarDays.map((date, i) => {
          const isSelected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          return (
            <button
              key={i}
              onClick={() => handleDateClick(date)}
              className={cn(
                'aspect-square flex items-center justify-center rounded-md text-xs transition-all',
                !isCurrentMonth && 'text-gray-300',
                isCurrentMonth && 'text-gray-600 hover:bg-gray-100',
                isSelected && 'bg-primary-600 text-white shadow-md hover:bg-primary-700',
                isTodayDate && !isSelected && 'ring-1 ring-primary-500 font-semibold text-primary-600 bg-primary-50'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </Card>
  );
}