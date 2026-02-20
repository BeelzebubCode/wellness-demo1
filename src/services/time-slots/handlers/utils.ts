// src/services/timeSlots/utils.ts
import { BKK_OFFSET, BKK_TZ } from "./constants";

export function createDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000${BKK_OFFSET}`);
}

export function getDayRangeBangkok(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000${BKK_OFFSET}`);
  const end = new Date(`${dateStr}T23:59:59.999${BKK_OFFSET}`);
  return { start, end };
}

export function fmtDateBkk(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function fmtTimeBkk(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BKK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function isValidDateStr(dateStr: string) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const { start } = getDayRangeBangkok(dateStr);
  return !Number.isNaN(start.getTime());
}
