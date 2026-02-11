// src/services/aiAgent/booking/plan/domain/serviceHours.ts

export type ServiceHours = {
  openMin: number;  // minutes since 00:00
  closeMin: number; // exclusive
  slotMin: number;  // 60
};

export const DEFAULT_SERVICE_HOURS: ServiceHours = {
  openMin: 8 * 60,    // 08:00
  closeMin: 20 * 60,  // 20:00 exclusive
  slotMin: 60,
};

export function hhmmToMin(hhmm: string): number | null {
  const m = String(hhmm || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(mi)) return null;
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}

export function isOutOfServiceTime(range: string, hours: ServiceHours) {
  const [start] = String(range || "").split("-");
  const startMin = hhmmToMin(start);
  if (startMin == null) return false;
  return startMin < hours.openMin || startMin >= hours.closeMin;
}

export function serviceHoursText(hours: ServiceHours) {
  // สำหรับ reply
  const slots: string[] = [];
  for (let m = hours.openMin; m < hours.closeMin; m += hours.slotMin) {
    const h1 = String(Math.floor(m / 60)).padStart(2, "0");
    const m1 = String(m % 60).padStart(2, "0");
    const m2 = m + hours.slotMin;
    const h2 = String(Math.floor(m2 / 60)).padStart(2, "0");
    const mm2 = String(m2 % 60).padStart(2, "0");
    slots.push(`• ${h1}:${m1}–${h2}:${mm2}`);
  }
  return slots.join("\n");
}
