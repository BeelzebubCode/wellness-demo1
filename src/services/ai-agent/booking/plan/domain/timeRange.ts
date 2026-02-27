// src/services/aiAgent/booking/plan/domain/timeRange.ts
import { timeHintRangeFromThai } from "../utils/time";
import { hhmmToMin } from "./serviceHours";

export type TimeRangeDecision =
  | { kind: "AUTO" }
  | { kind: "NEED_REASK" }
  | { kind: "RANGE"; value: string }; // "HH:mm-HH:mm"

export function userLooksLikeGaveTime(text: string) {
  const t = String(text || "");
  return (
    /\b\d{1,2}[:.]\d{2}\b/.test(t) ||
    /\b\d{1,2}\s*โมง/.test(t) ||
    /เช้า|สาย|บ่าย|เย็น|ค่ำ|เที่ยง/.test(t)
  );
}

function clampRangeToServiceHours(range: string, openMin: number, closeMin: number) {
  const m = String(range).trim().match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (!m) return range;
  const sMin = hhmmToMin(m[1]);
  const eMin = hhmmToMin(m[2]);
  if (sMin == null || eMin == null) return range;

  const s = Math.max(sMin, openMin);
  const e = Math.min(eMin, closeMin);
  if (e <= s) return range; // clamp แล้วพัง ก็คืนของเดิมให้ flow ไปถามใหม่ได้

  const sh = String(Math.floor(s / 60)).padStart(2, "0");
  const sm = String(s % 60).padStart(2, "0");
  const eh = String(Math.floor(e / 60)).padStart(2, "0");
  const em = String(e % 60).padStart(2, "0");
  return `${sh}:${sm}-${eh}:${em}`;
}

/**
 * ตัดสินใจ timeRange จากข้อความ user
 * - ถ้าผู้ใช้ตั้งใจบอกเวลา + parse ได้ => RANGE
 * - ถ้าผู้ใช้ตั้งใจบอกเวลา + parse ไม่ได้ => NEED_REASK
 * - ถ้าผู้ใช้ไม่บอกเวลา => AUTO
 */
export function decideTimeRange(input: {
  question: string;
  serviceOpenMin: number;
  serviceCloseMin: number;
}): { userTimeHint: boolean; hintedRange: string | null; decision: TimeRangeDecision } {
  const { question, serviceOpenMin, serviceCloseMin } = input;

  const hinted = timeHintRangeFromThai(question);
  const userTimeHint = userLooksLikeGaveTime(question) || !!hinted;

  if (!userTimeHint) {
    return { userTimeHint, hintedRange: null, decision: { kind: "AUTO" } };
  }

  if (hinted) {
    // clamp hint ให้อยู่ในช่วงให้บริการ (กัน 08-12)
    const clamped = clampRangeToServiceHours(hinted, serviceOpenMin, serviceCloseMin);
    return { userTimeHint, hintedRange: clamped, decision: { kind: "RANGE", value: clamped } };
  }

  // ตั้งใจบอกเวลา แต่ parse ไม่ได้
  return { userTimeHint, hintedRange: null, decision: { kind: "NEED_REASK" } };
}
