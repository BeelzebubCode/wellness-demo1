"use client";

import { cn } from "@/lib/cn";
import type { TimeSlotCore as TimeSlot } from "@/shared/types/timeSlot";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

export interface TimeSlotCardProps {
  slot: TimeSlot;
  onSelect: () => void;
  disabled?: boolean;
  showEndTime?: boolean;
}

type BadgeVariant = "available" | "full" | "blocked" | "past" | "closed" | "unavailable";

export function TimeSlotCard({ slot, onSelect, disabled = false, showEndTime = true }: TimeSlotCardProps) {
  const total = Number((slot as any).maxCapacity ?? 1);
  const booked = Number((slot as any).bookedCount ?? 0);
  const queueText = `${booked}/${total}`;

  const isAvailable = !!(slot as any).isAvailable && !disabled;

  const reason =
    disabled
      ? "BLOCKED_ACTIVE_BOOKING"
      : (slot as any).unavailableReason ?? ((slot as any).isPastTime ? "PAST_TIME" : null);

  const badge = (() => {
    if (isAvailable) {
      return { variant: "available" as BadgeVariant, icon: <CheckCircle className="w-3.5 h-3.5" />, text: `ว่าง ${queueText}` };
    }
    switch (reason) {
      case "PAST_TIME":
        return { variant: "past" as BadgeVariant, icon: <Clock className="w-3.5 h-3.5" />, text: "หมดเวลา" };
      case "FULL":
        return { variant: "full" as BadgeVariant, icon: <XCircle className="w-3.5 h-3.5" />, text: `เต็ม ${queueText}` };
      case "CLOSED":
        return { variant: "closed" as BadgeVariant, icon: <XCircle className="w-3.5 h-3.5" />, text: "ปิดรับจอง" };
      case "BLOCKED_ACTIVE_BOOKING":
        return { variant: "blocked" as BadgeVariant, icon: <AlertTriangle className="w-3.5 h-3.5" />, text: "มีคิวค้าง" };
      default:
        return { variant: "unavailable" as BadgeVariant, icon: <XCircle className="w-3.5 h-3.5" />, text: "ไม่พร้อมใช้งาน" };
    }
  })();

  const badgeClass = {
    available: "bg-green-100 text-green-700",
    full: "bg-red-100 text-red-700",
    past: "bg-slate-200 text-slate-700",
    closed: "bg-slate-200 text-slate-700",
    blocked: "bg-amber-100 text-amber-700",
    unavailable: "bg-gray-200 text-gray-700",
  }[badge.variant];

  return (
    <button
      type="button"
      onClick={() => {
        if (!isAvailable) return;
        onSelect();
      }}
      disabled={!isAvailable}
      className={cn(
        "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        isAvailable && [
          "bg-gradient-to-br from-green-50 to-emerald-50",
          "border-green-200 hover:border-green-400",
          "hover:shadow-md hover:scale-[1.02]",
          "focus:ring-green-500",
          "group",
        ],
        !isAvailable && ["bg-gray-50 border-gray-200", "cursor-not-allowed opacity-60"],
      )}
    >
      <div className="mb-2">
        <span className={cn("text-lg font-bold", isAvailable ? "text-green-700 group-hover:text-green-800" : "text-gray-400")}>
          {(slot as any).startTime ?? "-"}
        </span>

        {showEndTime && (
          <span className={cn("text-sm ml-1", isAvailable ? "text-green-600" : "text-gray-400")}>
            - {(slot as any).endTime ?? "-"}
          </span>
        )}
      </div>

      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", badgeClass)}>
        {badge.icon}
        <span>{badge.text}</span>
      </div>

      {isAvailable && (
        <div className="absolute inset-0 rounded-xl border-2 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
