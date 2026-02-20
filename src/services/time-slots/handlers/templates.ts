// src/services/timeSlots/templates.ts
import { createDateTime } from "./utils";
import { BKK_OFFSET } from "./constants";

export function getSlotTemplate(dateStr: string) {
  const dayOfWeek = new Date(`${dateStr}T00:00:00.000${BKK_OFFSET}`).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const openTime = "08:00";
  const closeTime = isWeekend ? "16:00" : "20:00";
  const slotDuration = 60;

  return { openTime, closeTime, slotDuration, isWeekend };
}

export function buildSlotRanges(dateStr: string) {
  const { openTime, closeTime, slotDuration } = getSlotTemplate(dateStr);

  const ranges: { start: Date; end: Date }[] = [];
  let currentTime = createDateTime(dateStr, openTime);
  const endTime = createDateTime(dateStr, closeTime);

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
    if (slotEnd <= endTime) ranges.push({ start: new Date(currentTime), end: slotEnd });
    currentTime = slotEnd;
  }

  return ranges;
}
