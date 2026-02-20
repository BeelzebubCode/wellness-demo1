// src/services/aiAgent/booking/cancel/domain/reason.ts

/**
 * ดึงเหตุผลจากข้อความผู้ใช้แบบง่าย
 * - ถ้า user พิมพ์ "ยกเลิก เพราะ..." / "ยกเลิกเนื่องจาก..." / "ยกเลิก: ..."
 * - หรือพิมพ์ประโยคยาวพอ (>=5) ก็ถือเป็นเหตุผลได้
 */
export function extractCancelReason(text: string): string | null {
  const t = String(text || "").trim();
  if (!t) return null;

  // ลบคำสั่งนำหน้า
  const cleaned = t
    .replace(/^ขอ\s*/g, "")
    .replace(/^ช่วย\s*/g, "")
    .replace(/^รบกวน\s*/g, "")
    .trim();

  // pattern: "ยกเลิก เพราะ/เนื่องจาก/เพราะว่า ..."
  const m1 = cleaned.match(/ยกเลิก(?:นัด)?\s*(?:เพราะ|เนื่องจาก|เพราะว่า)\s*(.+)$/);
  if (m1?.[1]?.trim()) return m1[1].trim();

  // pattern: "ยกเลิก: ..."
  const m2 = cleaned.match(/ยกเลิก(?:นัด)?\s*[:\-]\s*(.+)$/);
  if (m2?.[1]?.trim()) return m2[1].trim();

  // ถ้าเป็นข้อความสั้นมาก เช่น "ยกเลิก" หรือ "cancel" → ยังไม่มีเหตุผล
  if (/^(ยกเลิก|ยกเลิกนัด|cancel|ยกเลิกครับ|ยกเลิกค่ะ)$/i.test(cleaned)) return null;

  // ถ้า user พิมพ์เป็นเหตุผลล้วน ๆ (ยาวพอ)
  if (cleaned.length >= 5) return cleaned;

  return null;
}
