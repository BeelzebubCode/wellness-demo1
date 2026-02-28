"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { Clock, Users, TrendingUp, Trash2, Sparkles, Lock, Unlock } from "lucide-react";
import type { TimeSlot } from "@/features/schedule/types";

interface DayHeaderProps {
  date: Date;
  slots: TimeSlot[];
  isLoading?: boolean;
  onAutoGenerate: () => void;
  onDeleteAll: () => void;
  onCloseAllDay: () => void;
  onOpenAllDay: () => void;
}

export function DayHeader({
  date,
  slots,
  isLoading = false,
  onAutoGenerate,
  onDeleteAll,
  onCloseAllDay,
  onOpenAllDay,
}: DayHeaderProps) {
  const dayNumber = date.getDate();
  const dayName = date.toLocaleDateString("th-TH", { weekday: "short" });
  const monthYear = date.toLocaleDateString("th-TH", {
    month: "short",
    year: "numeric",
  });

  const stats = useMemo(() => {
    const totalSlots = slots.length;
    const totalCapacity = slots.reduce((sum, s) => sum + s.maxCapacity, 0);
    const totalBooked = slots.reduce((sum, s) => sum + s.bookedCount, 0);
    const lockedSlots = slots.filter(
      (s) => !s.isAvailable || s.status === "CLOSED",
    ).length;
    const utilizationRate =
      totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    return { totalSlots, totalCapacity, totalBooked, lockedSlots, utilizationRate };
  }, [slots]);

  const hasBookings = stats.totalBooked > 0;
  const hasAvailableSlots = slots.some(s => s.isAvailable);
  const hasUnavailableSlots = slots.some(s => !s.isAvailable);

  // Dynamic utilization color
  const utilizationColor =
    stats.utilizationRate >= 80
      ? "text-rose-600 bg-rose-50 border-rose-100"
      : stats.utilizationRate >= 40
        ? "text-amber-600 bg-amber-50 border-amber-100"
        : "text-primary-500 bg-primary-50 border-primary-100";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date + Stats */}
        <div className="flex items-center gap-4">
          {/* Date Badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-200/40 flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{dayName}</span>
            <span className="text-xl font-extrabold leading-none">{dayNumber}</span>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700">{monthYear}</div>
            {/* Stats row */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-lg text-xs">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="font-bold text-blue-700">{stats.totalSlots}</span>
                <span className="text-blue-400 hidden sm:inline">ช่วง</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 border border-primary-100 rounded-lg text-xs">
                <Users className="w-3 h-3 text-primary-500" />
                <span className="font-bold text-primary-500">
                  {stats.totalBooked}/{stats.totalCapacity}
                </span>
              </div>

              <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs border", utilizationColor)}>
                <TrendingUp className="w-3 h-3" />
                <span className="font-bold">{stats.utilizationRate}%</span>
              </div>

              {stats.lockedSlots > 0 && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-lg border border-slate-200">
                  ปิด {stats.lockedSlots}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {slots.length === 0 ? (
            <button
              onClick={onAutoGenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              สร้างอัตโนมัติ
            </button>
          ) : (
            <>
              {!hasBookings && (
                <button
                  onClick={onDeleteAll}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ลบทั้งหมด</span>
                </button>
              )}
              {hasUnavailableSlots && (
                <button
                  onClick={onOpenAllDay}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-200/40 transition-all disabled:opacity-50"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  เปิดทั้งวัน
                </button>
              )}
              {hasAvailableSlots && (
                <button
                  onClick={onCloseAllDay}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-all disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  ปิดทั้งวัน
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DayHeader;
