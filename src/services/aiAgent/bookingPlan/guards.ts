// src/services/aiAgent/bookingPlan/guards.ts
import { bkkTodayISO, isISODate, isPastDateISO, extractDateISOFromThai } from "./time";

/**
 * ✅ กันบัค: ห้ามจับเลขวันมั่ว
 * - จะยอม "override plan.date" จากข้อความ ก็ต่อเมื่อข้อความดูเหมือนระบุวันจริงๆ
 * - ป้องกันกรณีผู้ใช้พิมพ์ "เครียด 27 อย่าง..." แล้วโดนตีเป็นวันที่ 27
 */
export function userLooksLikeGaveDate(text: string) {
  const t = String(text || "").trim();
  return (
    /วันนี้|พรุ่งนี้|มะรืน/.test(t) ||
    /\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(t) || // 29/01
    /(?:จอง|วันที่|วัน)\s*\d{1,2}\b/.test(t) // จอง 29 / วันที่ 29
  );
}

/**
 * ✅ normalize date ของ plan
 * - ถ้า plan.date ไม่ใช่ ISO -> null
 * - ถ้า user ระบุวันชัดๆ -> override จากข้อความ
 * - ถ้าไม่มีวัน -> default วันนี้ (BKK)
 * - ถ้าเป็นอดีต -> set วันนี้ (BKK)
 */
export function normalizePlanDate(input: {
  question: string;
  planDate: string | null | undefined;
}) {
  const { question } = input;
  let date = input.planDate ?? null;

  // override date เฉพาะเมื่อ user ดูเหมือนระบุวันจริงๆ
  const explicitDate = extractDateISOFromThai(question);
  if (explicitDate && userLooksLikeGaveDate(question)) {
    date = explicitDate;
  }

  // validate
  if (date && !isISODate(date)) date = null;

  // default today
  if (!date) date = bkkTodayISO();

  // no past date
  if (date && isPastDateISO(date)) date = bkkTodayISO();

  return date;
}
