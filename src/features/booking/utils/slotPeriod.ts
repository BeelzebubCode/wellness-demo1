// src/features/booking/utils/slotPeriod.ts
import type { TimeSlot } from "../types";

export type SlotPeriod = "ALL" | "MORNING" | "AFTERNOON" | "EVENING";

export function getPeriodLabel(p: SlotPeriod) {
  if (p === "MORNING") return "เช้า";
  if (p === "AFTERNOON") return "บ่าย";
  if (p === "EVENING") return "เย็น";
  return "ทั้งหมด";
}

export function filterSlotsByPeriod(slots: TimeSlot[], period: SlotPeriod) {
  if (period === "ALL") return slots;

  return slots.filter((s) => {
    const hour = new Date(s.startAt).getHours();
    if (period === "MORNING") return hour >= 6 && hour < 12;
    if (period === "AFTERNOON") return hour >= 12 && hour < 17;
    return hour >= 17 && hour < 22;
  });
}
