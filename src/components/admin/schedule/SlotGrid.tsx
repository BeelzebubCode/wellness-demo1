// src/components/admin/schedule/SlotGrid.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { Sun, Cloud, Moon, Plus, Calendar } from "lucide-react";
import { SlotCard } from "./SlotCard";
import type { TimeSlot } from "@/features/schedule/types";

interface SlotGridProps {
  slots: TimeSlot[];
  isLoading: boolean;
  onSlotClick: (slot: TimeSlot) => void;
  onAddSlot: () => void;
}

// Time period config
const TIME_PERIODS = [
  {
    id: "morning",
    label: "ช่วงเช้า",
    range: "08:00 - 12:00",
    icon: Sun,
    color: "text-amber-500",
    bg: "bg-amber-50",
    minHour: 0,
    maxHour: 12,
  },
  {
    id: "afternoon",
    label: "ช่วงบ่าย",
    range: "12:00 - 17:00",
    icon: Cloud,
    color: "text-orange-500",
    bg: "bg-orange-50",
    minHour: 12,
    maxHour: 17,
  },
  {
    id: "evening",
    label: "ช่วงเย็น",
    range: "17:00 - 20:00",
    icon: Moon,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    minHour: 17,
    maxHour: 24,
  },
];

export function SlotGrid({
  slots,
  isLoading,
  onSlotClick,
  onAddSlot,
}: SlotGridProps) {
  // Sort and group slots
  const groupedSlots = useMemo(() => {
    const sorted = [...slots].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    const groups: Record<string, TimeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    sorted.forEach((slot) => {
      const hour = parseInt(slot.startTime.split(":")[0]);

      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 17) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
    });

    return groups;
  }, [slots]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="mt-3 text-sm text-slate-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <Calendar className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-600 mb-1">
          ยังไม่มีช่วงเวลา
        </p>
        <p className="text-xs text-slate-400 mb-4">
          เพิ่มช่วงเวลาเพื่อเปิดให้จอง
        </p>
        <button
          onClick={onAddSlot}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มช่วงเวลา
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {TIME_PERIODS.map((period) => {
        const periodSlots = groupedSlots[period.id];
        if (periodSlots.length === 0) return null;

        const Icon = period.icon;

        return (
          <div key={period.id} className="rounded-2xl border border-slate-200 bg-white p-3">
            {/* Period Header */}
            <div
              className={cn(
                "flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border border-slate-200/60",
                "bg-white shadow-sm"
              )}
            >
              <Icon className={cn("w-4 h-4", period.color)} />
              <span className="text-sm font-medium text-slate-700">
                {period.label}
              </span>
              <span className="text-xs text-slate-400">({period.range})</span>
              <span className="ml-auto text-xs font-medium text-slate-500">
                {periodSlots.length} ช่วง
              </span>
            </div>

            {/* Slots Grid */}
            <div
              className="
                grid gap-3 justify-start
                [grid-template-columns:repeat(auto-fill,minmax(140px,140px))]
                max-[420px]:[grid-template-columns:repeat(auto-fill,minmax(120px,120px))]
            "
            >
              {periodSlots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} onClick={onSlotClick} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Button */}
      <button
        onClick={onAddSlot}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">เพิ่มช่วงเวลา</span>
      </button>
    </div>
  );
}

export default SlotGrid;
