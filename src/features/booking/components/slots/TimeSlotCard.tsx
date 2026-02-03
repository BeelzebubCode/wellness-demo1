"use client";

import { cn } from "@/lib/cn";
import type { BookingTimeSlot } from "@/features/booking/types";

export function TimeSlotCard({
  slot,
  isSelected,
  disabled,
  onClick,
}: {
  slot: BookingTimeSlot;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const isDisabled = disabled || !slot.isAvailable;

  return (
    <button
      type="button"
      onClick={() => {
        if (isDisabled) return;
        onClick?.();
      }}
      disabled={isDisabled}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition",
        "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
        isDisabled
          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
          : "border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50/40",
        isSelected && !isDisabled && "border-primary-500 bg-primary-50 text-primary-800",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {slot.startTime} - {slot.endTime} น.
        </div>

        <div
          className={cn(
            "text-xs rounded-full px-2 py-1",
            isDisabled ? "bg-gray-200 text-gray-500" : "bg-emerald-50 text-emerald-700",
          )}
        >
          {isDisabled ? "ไม่ว่าง" : "ว่าง"}
        </div>
      </div>

      {/* เผื่ออนาคต: แสดงว่ามี ONLINE/ONSITE อะไรบ้าง */}
      {!!slot.services?.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {slot.services
            .filter((s) => s?.isActive !== false)
            .map((s) => (
              <span
                key={s.id}
                className={cn(
                  "text-[11px] rounded-full border px-2 py-0.5",
                  s.serviceMode === "ONLINE"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                {s.serviceMode === "ONLINE" ? "ออนไลน์" : "ออนไซต์"}
              </span>
            ))}
        </div>
      )}
    </button>
  );
}
