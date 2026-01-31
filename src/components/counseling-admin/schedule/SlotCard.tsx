// src/components/admin/schedule/SlotCard.tsx
"use client";

import { cn } from "@/lib/cn";
import { Lock, Users } from "lucide-react";
import type { TimeSlot } from "@/features/schedule/types";

interface SlotCardProps {
  slot: TimeSlot;
  onClick: (slot: TimeSlot) => void;
  disabled?: boolean;
}

export function SlotCard({ slot, onClick, disabled = false }: SlotCardProps) {
  // Status calculations
  const isFull = slot.bookedCount >= slot.maxCapacity;
  const isLocked = slot.status === "CLOSED" || !slot.isAvailable;
  const hasBookings = slot.bookedCount > 0;
  const availableSlots = Math.max(0, slot.maxCapacity - slot.bookedCount);

  // Status-based styling
  const getStatusStyles = () => {
    if (isLocked) {
      return {
        card: "bg-slate-100 border-slate-300 opacity-60",
        time: "text-slate-400",
        badge: "bg-slate-200 text-slate-500",
        status: "ปิด",
      };
    }
    if (isFull) {
      return {
        card: "bg-rose-50 border-rose-300",
        time: "text-rose-600",
        badge: "bg-rose-100 text-rose-600",
        status: "เต็ม",
      };
    }
    if (hasBookings) {
      return {
        card: "bg-amber-50 border-amber-300",
        time: "text-amber-700",
        badge: "bg-amber-100 text-amber-600",
        status: `ว่าง ${availableSlots}`,
      };
    }
    return {
      card: "bg-white border-emerald-300 hover:border-emerald-400 hover:shadow",
      time: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-600",
      status: `ว่าง ${availableSlots}`,
    };
  };

  const styles = getStatusStyles();

  return (
    <button
      type="button"
      onClick={() => onClick(slot)}
      disabled={disabled}
      className={cn(
        "relative w-full text-left rounded-xl border-2 p-3 min-h-[108px] transition-all cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
        styles.card,
        disabled && "pointer-events-none"
      )}
    >
      {/* Lock Icon for closed slots */}
      {isLocked && (
        <div className="absolute top-1 right-1">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        </div>
      )}

      {/* Time */}
      <div className={cn("text-lg font-bold leading-tight", styles.time)}>
        {slot.startTime}
      </div>
      <div className="text-[10px] text-slate-400 leading-tight mb-1.5">
        {slot.endTime}
      </div>

      {/* Capacity Badge */}
      <div
        className={cn(
          "flex items-center justify-center gap-1 py-1 rounded text-xs font-semibold",
          styles.badge
        )}
      >
        <Users className="w-3 h-3" />
        <span>
          {slot.bookedCount}/{slot.maxCapacity}
        </span>
      </div>

      {/* Status Text */}
      <div className="text-[9px] text-center text-slate-500 mt-1">
        {styles.status}
      </div>
    </button>
  );
}

export default SlotCard;
