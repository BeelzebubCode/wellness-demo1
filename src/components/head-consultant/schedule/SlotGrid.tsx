// src/components/admin/schedule/SlotGrid.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { Sun, Cloud, Moon, Plus, Calendar } from "lucide-react";
import { SlotCard } from "./SlotCard";
import type { SlotColorTheme } from "./SlotCard";
import type { TimeSlot } from "@/features/schedule/types";

interface SlotGridProps {
  slots: TimeSlot[];
  isLoading: boolean;
  onSlotClick: (slot: TimeSlot) => void;
  onAddSlot: () => void;
}

// Time period config with dynamic colors
const TIME_PERIODS: Array<{
  id: string;
  label: string;
  range: string;
  icon: typeof Sun;
  color: string;
  bg: string;
  borderColor: string;
  dotColor: string;
  slotTheme: SlotColorTheme;
  minHour: number;
  maxHour: number;
}> = [
    {
      id: "morning",
      label: "ช่วงเช้า",
      range: "08:00 – 12:00",
      icon: Sun,
      color: "text-amber-600",
      bg: "bg-gradient-to-r from-amber-50 to-amber-100/50",
      borderColor: "border-amber-200",
      dotColor: "bg-amber-400",
      slotTheme: "amber",
      minHour: 0,
      maxHour: 12,
    },
    {
      id: "afternoon",
      label: "ช่วงบ่าย",
      range: "12:00 – 17:00",
      icon: Cloud,
      color: "text-orange-600",
      bg: "bg-gradient-to-r from-orange-50 to-orange-100/50",
      borderColor: "border-orange-200",
      dotColor: "bg-orange-400",
      slotTheme: "orange",
      minHour: 12,
      maxHour: 17,
    },
    {
      id: "evening",
      label: "ช่วงเย็น",
      range: "17:00 – 20:00",
      icon: Moon,
      color: "text-indigo-600",
      bg: "bg-gradient-to-r from-indigo-50 to-indigo-100/50",
      borderColor: "border-indigo-200",
      dotColor: "bg-indigo-400",
      slotTheme: "indigo",
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
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 rounded-full border-t-transparent animate-spin" style={{ borderWidth: 4, borderColor: 'rgb(var(--primary) / 0.3)', borderTopColor: 'transparent' }} />
        </div>
        <p className="mt-3 text-sm text-slate-400">กำลังโหลดตาราง...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-600 mb-1">
          ยังไม่มีช่วงเวลา
        </p>
        <p className="text-xs text-slate-400 mb-5">
          เพิ่มช่วงเวลาเพื่อเปิดให้จอง
        </p>
        <button
          onClick={onAddSlot}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-md shadow-primary-200/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          เพิ่มช่วงเวลา
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {TIME_PERIODS.map((period) => {
        const periodSlots = groupedSlots[period.id];
        if (periodSlots.length === 0) return null;

        const Icon = period.icon;

        return (
          <div key={period.id}>
            {/* Period Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl",
                  period.bg,
                  period.borderColor,
                  "border"
                )}
              >
                <Icon className={cn("w-4 h-4", period.color)} />
                <span className={cn("text-sm font-bold", period.color)}>
                  {period.label}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                ({period.range})
              </span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-semibold text-slate-400">
                {periodSlots.length} ช่วง
              </span>
            </div>

            {/* Slots Grid */}
            <div
              className="
                grid gap-3 justify-start
                [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]
                max-[420px]:[grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]
              "
            >
              {periodSlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onClick={onSlotClick}
                  colorTheme={period.slotTheme}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Button */}
      <button
        onClick={onAddSlot}
        className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all flex items-center justify-center gap-2 group"
      >
        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold">เพิ่มช่วงเวลา</span>
      </button>
    </div>
  );
}

export default SlotGrid;
