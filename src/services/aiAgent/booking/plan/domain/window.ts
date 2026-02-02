// src/services/aiAgent/booking/plan/domain/window.ts
import { addDaysISO, bkkTodayISO } from "../utils/time";

export type BookingWindow = {
  todayISO: string;
  minISO: string;
  maxISO: string;
  minDays: number;
  maxDays: number;
};

export function getBookingWindow(maxBookAheadDays: number): BookingWindow {
  const todayISO = bkkTodayISO();
  const minISO = todayISO;
  const maxISO = addDaysISO(todayISO, maxBookAheadDays);

  return {
    todayISO,
    minISO,
    maxISO,
    minDays: 0,
    maxDays: maxBookAheadDays,
  };
}

export function isOutOfWindow(dateISO: string, window: BookingWindow) {
  return String(dateISO) < String(window.minISO) || String(dateISO) > String(window.maxISO);
}
