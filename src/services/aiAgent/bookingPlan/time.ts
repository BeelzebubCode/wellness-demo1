// services/aiAgent/bookingPlan/time.ts

const TZ = "Asia/Bangkok";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function bkkNowParts() {
  const d = new Date();

  const y = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric" }).format(
      d,
    ),
  );
  const m = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, month: "2-digit" }).format(
      d,
    ),
  );
  const day = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, day: "2-digit" }).format(
      d,
    ),
  );

  return { y, m, day };
}

function daysInMonth(y: number, m: number) {
  // m is 1-12
  return new Date(y, m, 0).getDate();
}

/** วันนี้ (Bangkok) => "YYYY-MM-DD" */
export function bkkTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim());
}

export function isPastDateISO(dateISO: string) {
  return String(dateISO) < bkkTodayISO();
}

export function bkkRange(date: string) {
  const start = new Date(`${date}T00:00:00.000+07:00`);
  const end = new Date(`${date}T23:59:59.999+07:00`);
  return { start, end };
}

function hasExplicitClock(text: string) {
  return /\b\d{1,2}:\d{2}\b/.test(text || "");
}

/** ถ้ามีคำว่า เช้า/บ่าย/เย็น และ “ไม่มีเวลาแบบ 14:00” -> คืน timeRange */
export function timeHintRangeFromThai(text: string) {
  const t = (text || "").toLowerCase();
  if (hasExplicitClock(t)) return null;

  if (t.includes("ช่วงเช้า") || t.includes("ตอนเช้า") || /\bเช้า\b/.test(t))
    return "08:00-12:00";
  if (t.includes("ช่วงบ่าย") || t.includes("ตอนบ่าย") || /\bบ่าย\b/.test(t))
    return "12:00-17:00";
  if (t.includes("ช่วงเย็น") || t.includes("ตอนเย็น") || /\bเย็น\b/.test(t))
    return "17:00-20:00";

  return null;
}

export function fmtBkkHHMM(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

export function toMinBkk(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hh * 60 + mm;
}

/**
 * ✅ parse วันที่จากข้อความไทยแบบง่าย ๆ
 * รองรับ:
 * - วันนี้ / พรุ่งนี้ / มะรืน
 * - 29/01, 29 / 1
 * - "จอง 29 ..." / "วันที่ 29" / "วัน 29"
 * - "29 การเงิน ..." (เลขวันขึ้นต้นประโยค)
 */
export function extractDateISOFromThai(text: string): string | null {
  const t = String(text || "").trim();

  // relative
  if (t.includes("วันนี้")) return bkkTodayISO();

  if (t.includes("พรุ่งนี้")) {
    const { y, m, day } = bkkNowParts();
    const dt = new Date(`${y}-${pad2(m)}-${pad2(day)}T00:00:00+07:00`);
    dt.setDate(dt.getDate() + 1);
    return dt.toLocaleDateString("en-CA", { timeZone: TZ });
  }

  if (t.includes("มะรืน")) {
    const { y, m, day } = bkkNowParts();
    const dt = new Date(`${y}-${pad2(m)}-${pad2(day)}T00:00:00+07:00`);
    dt.setDate(dt.getDate() + 2);
    return dt.toLocaleDateString("en-CA", { timeZone: TZ });
  }

  // dd/mm หรือ d/m
  const m1 = t.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/);
  if (m1) {
    const dd = Number(m1[1]);
    const mm = Number(m1[2]);
    const { y } = bkkNowParts();

    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= daysInMonth(y, mm)) {
      return `${y}-${pad2(mm)}-${pad2(dd)}`;
    }
  }

  // "จอง 29" / "วันที่ 29" / "วัน 29"
  const m2 = t.match(/(?:จอง|วันที่|วัน)\s*(\d{1,2})\b/);

  const ddRaw = m2?.[1];
  if (ddRaw) {
    const dd = Number(ddRaw);
    const { y, m, day } = bkkNowParts();

    if (dd < 1 || dd > 31) return null;

    let yy = y;
    let mm = m;

    if (dd > daysInMonth(yy, mm)) return null;

    if (dd < day) {
      mm += 1;
      if (mm === 13) {
        mm = 1;
        yy += 1;
      }
      if (dd > daysInMonth(yy, mm)) return null;
    }

    return `${yy}-${pad2(mm)}-${pad2(dd)}`;
  }

  return null;
}

/** เพิ่มวันให้ dateISO ("YYYY-MM-DD") แล้วคืน dateISO ใหม่ */
export function addDaysISO(dateISO: string, days: number) {
  if (!dateISO) return bkkTodayISO();
  const base = new Date(`${dateISO}T00:00:00+07:00`);
  if (Number.isNaN(base.getTime())) return bkkTodayISO();
  base.setDate(base.getDate() + Number(days || 0));
  return base.toLocaleDateString("en-CA", { timeZone: TZ });
}
