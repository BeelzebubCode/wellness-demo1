// src/features/booking/utils/slotPeriod.ts

export type SlotPeriod = "MORNING" | "AFTERNOON" | "EVENING";

export function hourOfHHMM(hhmm: string) {
  return parseInt((hhmm || "0").split(":")[0] || "0", 10);
}

export function isSlotInPeriod(startTime: string, period: SlotPeriod) {
  const h = hourOfHHMM(startTime);

  if (period === "MORNING") return h < 12;
  if (period === "AFTERNOON") return h >= 12 && h < 17;
  return h >= 17; // EVENING
}
