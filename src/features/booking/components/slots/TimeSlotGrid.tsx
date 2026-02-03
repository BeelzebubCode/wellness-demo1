"use client";

import { LoadingSpinner } from "@/components/ui";
import type { BookingTimeSlot } from "@/features/booking/types";
import { TimeSlotCard } from "./TimeSlotCard";

export function TimeSlotGrid({
  selectedDate,
  slots,
  onSelectSlot,
  isLoading,
  hasActiveBooking,
  selectedSlotId,
}: {
  selectedDate: Date;
  slots: BookingTimeSlot[];
  onSelectSlot: (slot: BookingTimeSlot) => void;
  isLoading?: boolean;
  hasActiveBooking?: boolean;
  selectedSlotId?: number | null;
}) {
  if (isLoading) {
    return (
      <div className="py-10">
        <LoadingSpinner label="กำลังโหลดช่วงเวลา..." />
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        ไม่มีช่วงเวลาว่างในวันนี้
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {slots.map((slot) => (
        <TimeSlotCard
          key={slot.id}
          slot={slot}
          isSelected={selectedSlotId === slot.id}
          disabled={!!hasActiveBooking}
          onClick={() => onSelectSlot(slot)}
        />
      ))}
    </div>
  );
}
