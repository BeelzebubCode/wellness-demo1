// src/services/aiAgent/booking/plan/utils/guards.ts
import { bkkTodayISO, isISODate, isPastDateISO, extractDateISOFromThai } from "./time";

export function userLooksLikeGaveDate(text: string) {
  const t = String(text || "").trim();
  if (/วันนี้|พรุ่งนี้|มะรืน/.test(t)) return true;
  if (/\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(t)) return true;
  if (/(?:จอง|วันที่)\s*\d{1,2}\b/.test(t)) return true;
  if (/วัน\s*(?:ที่|ที)\s*\d{1,2}\b/.test(t)) return true;
  return false;
}

export function normalizePlanDate(input: { question: string; planDate: string | null | undefined }) {
  const { question } = input;
  let date = input.planDate ?? null;

  const explicitDate = extractDateISOFromThai(question);
  if (explicitDate && userLooksLikeGaveDate(question)) date = explicitDate;

  if (date && !isISODate(date)) date = null;
  if (!date) date = bkkTodayISO();
  if (date && isPastDateISO(date)) date = bkkTodayISO();

  return date;
}
