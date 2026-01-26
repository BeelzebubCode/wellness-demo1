// src/components/admin/schedule/DayHeader.tsx
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { 
  Clock,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import type { TimeSlot } from '@/features/schedule/types';

interface DayHeaderProps {
  date: Date;
  slots: TimeSlot[];
  isLoading?: boolean;
  onAutoGenerate: () => void;
  onDeleteAll: () => void;
  onAddSlot: () => void;
}

export function DayHeader({
  date,
  slots,
  isLoading = false,
  onAutoGenerate,
  onDeleteAll,
  onAddSlot
}: DayHeaderProps) {
  const dayNumber = date.getDate();
  const dayName = date.toLocaleDateString('th-TH', { weekday: 'short' });
  const monthYear = date.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });

  // Calculate stats
  const stats = useMemo(() => {
    const totalSlots = slots.length;
    const totalCapacity = slots.reduce((sum, s) => sum + s.maxCapacity, 0);
    const totalBooked = slots.reduce((sum, s) => sum + s.bookedCount, 0);
    const availableSlots = slots.filter(s => s.isAvailable && s.bookedCount < s.maxCapacity).length;
    const lockedSlots = slots.filter(s => !s.isAvailable || s.status === 'LOCKED').length;
    const utilizationRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    return { totalSlots, totalCapacity, totalBooked, availableSlots, lockedSlots, utilizationRate };
  }, [slots]);

  const hasBookings = stats.totalBooked > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date + Stats */}
        <div className="flex items-center gap-3">
          {/* Date Badge */}
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-emerald-500 text-white flex-shrink-0">
            <span className="text-[9px] font-medium uppercase">{dayName}</span>
            <span className="text-lg font-bold leading-none">{dayNumber}</span>
          </div>

          {/* Month/Year */}
          <div className="hidden sm:block text-sm text-slate-500">
            {monthYear}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-slate-700">{stats.totalSlots}</span>
              <span className="text-slate-400 text-xs hidden sm:inline">ช่วงเวลา</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-slate-700">{stats.totalBooked}/{stats.totalCapacity}</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-slate-700">{stats.utilizationRate}%</span>
            </div>

            {stats.lockedSlots > 0 && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-medium rounded">
                ปิด {stats.lockedSlots}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {slots.length === 0 ? (
            <button
              onClick={onAutoGenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              สร้างอัตโนมัติ
            </button>
          ) : !hasBookings && (
            <button
              onClick={onDeleteAll}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ลบทั้งหมด</span>
            </button>
          )}

          <button
            onClick={onAddSlot}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มช่วงเวลา
          </button>
        </div>
      </div>
    </div>
  );
}

export default DayHeader;