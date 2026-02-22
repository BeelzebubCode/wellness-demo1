// src/components/admin/schedule/SlotCard.tsx
"use client";

import { cn } from "@/lib/cn";
import { Lock, Users, CheckCircle } from "lucide-react";
import type { TimeSlot } from "@/features/schedule/types";

export type SlotColorTheme = "amber" | "orange" | "indigo" | "emerald";

interface SlotCardProps {
  slot: TimeSlot;
  onClick: (slot: TimeSlot) => void;
  disabled?: boolean;
  colorTheme?: SlotColorTheme;
}

const THEME_STYLES: Record<
  SlotColorTheme,
  {
    available: { card: string; time: string; badge: string };
    booked: { card: string; time: string; badge: string };
  }
> = {
  amber: {
    available: {
      card: "bg-amber-50/60 border-amber-200 hover:border-amber-300 hover:-translate-y-0.5 hover:shadow-md",
      time: "text-amber-800",
      badge: "bg-amber-100/80 text-amber-700",
    },
    booked: {
      card: "bg-amber-50/80 border-amber-300",
      time: "text-amber-800",
      badge: "bg-amber-200/80 text-amber-800",
    },
  },
  orange: {
    available: {
      card: "bg-orange-50/60 border-orange-200 hover:border-orange-300 hover:-translate-y-0.5 hover:shadow-md",
      time: "text-orange-800",
      badge: "bg-orange-100/80 text-orange-700",
    },
    booked: {
      card: "bg-orange-50/80 border-orange-300",
      time: "text-orange-800",
      badge: "bg-orange-200/80 text-orange-800",
    },
  },
  indigo: {
    available: {
      card: "bg-indigo-50/60 border-indigo-200 hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-md",
      time: "text-indigo-800",
      badge: "bg-indigo-100/80 text-indigo-700",
    },
    booked: {
      card: "bg-indigo-50/80 border-indigo-300",
      time: "text-indigo-800",
      badge: "bg-indigo-200/80 text-indigo-800",
    },
  },
  emerald: {
    available: {
      card: "bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 hover:-translate-y-0.5 hover:shadow-md",
      time: "text-emerald-800",
      badge: "bg-emerald-100/80 text-emerald-700",
    },
    booked: {
      card: "bg-emerald-50/80 border-emerald-300",
      time: "text-emerald-800",
      badge: "bg-emerald-200/80 text-emerald-800",
    },
  },
};

export function SlotCard({
  slot,
  onClick,
  disabled = false,
  colorTheme = "emerald",
}: SlotCardProps) {
  const isFull = slot.bookedCount >= slot.maxCapacity;
  const isLocked = slot.status === "CLOSED" || !slot.isAvailable;
  const hasBookings = slot.bookedCount > 0;
  const availableSlots = Math.max(0, slot.maxCapacity - slot.bookedCount);
  const utilization = slot.maxCapacity > 0 ? (slot.bookedCount / slot.maxCapacity) * 100 : 0;

  const theme = THEME_STYLES[colorTheme];

  const getStatusStyles = () => {
    if (isLocked) {
      return {
        card: "bg-slate-50 border-slate-200 opacity-50",
        time: "text-slate-400",
        badge: "bg-slate-100 text-slate-400",
        statusLabel: "ปิดให้บริการ",
        statusColor: "text-slate-400",
      };
    }
    if (isFull) {
      return {
        card: "bg-rose-50/70 border-rose-200",
        time: "text-rose-600",
        badge: "bg-rose-100 text-rose-700",
        statusLabel: "เต็ม",
        statusColor: "text-rose-600 font-semibold",
      };
    }
    if (hasBookings) {
      return {
        ...theme.booked,
        statusLabel: `ว่าง ${availableSlots} ที่`,
        statusColor: theme.booked.time,
      };
    }
    return {
      ...theme.available,
      statusLabel: `ว่าง ${availableSlots} ที่`,
      statusColor: theme.available.time,
    };
  };

  const styles = getStatusStyles();

  return (
    <button
      type="button"
      onClick={() => onClick(slot)}
      disabled={disabled}
      className={cn(
        "relative w-full text-left rounded-2xl border-2 p-3.5 transition-all duration-300 cursor-pointer group hover:bg-white",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        colorTheme === "amber" && "focus:ring-amber-300",
        colorTheme === "orange" && "focus:ring-orange-300",
        colorTheme === "indigo" && "focus:ring-indigo-300",
        colorTheme === "emerald" && "focus:ring-emerald-300",
        styles.card,
        disabled && "pointer-events-none"
      )}
    >
      {/* Lock icon */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3.5 h-3.5 text-slate-300" />
        </div>
      )}

      {/* Full check icon */}
      {isFull && !isLocked && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
        </div>
      )}

      {/* Time */}
      <div className={cn("text-base font-bold mb-1.5 flex items-center justify-center gap-1", styles.time)}>
        <span>{slot.startTime}</span>
        <span className="text-xs font-medium opacity-60">–</span>
        <span>{slot.endTime}</span>
      </div>

      {/* Capacity badge */}
      <div
        className={cn(
          "flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold w-fit mx-auto",
          styles.badge
        )}
      >
        <Users className="w-3 h-3" />
        <span>
          {slot.bookedCount}/{slot.maxCapacity}
        </span>
      </div>

      {/* Utilization bar */}
      {!isLocked && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100/80 overflow-hidden shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isFull
                ? "bg-rose-400"
                : hasBookings
                  ? colorTheme === "amber"
                    ? "bg-amber-400"
                    : colorTheme === "orange"
                      ? "bg-orange-400"
                      : colorTheme === "indigo"
                        ? "bg-indigo-400"
                        : "bg-emerald-400"
                  : "bg-slate-200"
            )}
            style={{ width: `${Math.max(utilization, 0)}%` }}
          />
        </div>
      )}

      {/* Status */}
      <div className={cn("text-[11px] text-center mt-2.5 font-semibold", styles.statusColor)}>
        {styles.statusLabel}
      </div>
    </button>
  );
}

export default SlotCard;
