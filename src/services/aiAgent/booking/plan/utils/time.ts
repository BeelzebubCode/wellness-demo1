// services/aiAgent/bookingPlan/time.ts

const TZ = "Asia/Bangkok";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(y: number, m: number) {
  // m is 1-12
  return new Date(y, m, 0).getDate();
}

/**
 * ✅ ฟอร์แมต Date -> YYYY-MM-DD โดยบังคับ timezone Bangkok (ชัวร์สุด)
 */
export function fmtBkkDateISO(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const da = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${da}`;
}

/** วันนี้ (Bangkok) => "YYYY-MM-DD" */
export function bkkTodayISO(): string {
  return fmtBkkDateISO(new Date());
}

/** คืนปี/เดือน/วันของ "ตอนนี้" ตาม BKK */
function bkkNowParts() {
  const nowISO = bkkTodayISO(); // YYYY-MM-DD
  return {
    y: Number(nowISO.slice(0, 4)),
    m: Number(nowISO.slice(5, 7)),
    day: Number(nowISO.slice(8, 10)),
  };
}

export function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim());
}

export function isPastDateISO(dateISO: string) {
  return String(dateISO) < bkkTodayISO();
}

/**
 * ✅ ช่วงวันตาม BKK (ใช้ +07:00 ชัดเจน)
 * หมายเหตุ: ใช้ end แบบ lt endOfDay+1 จะชัวร์กว่า 23:59:59.999
 */
export function bkkRange(date: string) {
  const start = new Date(`${date}T00:00:00.000+07:00`);
  const end = new Date(`${date}T00:00:00.000+07:00`);
  end.setDate(end.getDate() + 1); // วันถัดไป 00:00
  return { start, end };
}

function _hasExplicitClock(text: string) {
  return /\b\d{1,2}:\d{2}\b/.test(text || "");
}

function extractHourThai(text: string): number | null {
  const m = text.match(/\b(\d{1,2})\s*โมง/);
  if (!m) return null;

  const h = Number(m[1]);
  if (h < 0 || h > 23) return null;
  return h;
}

/** ถ้ามีคำว่า เช้า/บ่าย/เย็น และ “ไม่มีเวลาแบบ 14:00” -> คืน timeRange */
export function timeHintRangeFromThai(text: string) {
  const t = (text || "").toLowerCase();

  // 1️⃣ explicit HH:MM
  if (/\b\d{1,2}:\d{2}\b/.test(t)) return null;

  // 2️⃣ "10 โมง"
  const hour = extractHourThai(t);
  if (hour !== null) {
    const h1 = String(hour).padStart(2, "0");
    const h2 = String(hour + 1).padStart(2, "0");
    return `${h1}:00-${h2}:00`;
  }

  // 3️⃣ เช้า / บ่าย / เย็น
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
 * ✅ เพิ่มวันแบบ “กัน timezone เพี้ยน”:
 * - สร้าง Date ที่เที่ยง (+07:00) แล้วค่อยบวกวัน
 * - คืนผลด้วย fmtBkkDateISO
 */
export function addDaysISO(dateISO: string, days: number) {
  const baseISO = dateISO && isISODate(dateISO) ? dateISO : bkkTodayISO();
  const d = new Date(`${baseISO}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return bkkTodayISO();
  d.setDate(d.getDate() + Number(days || 0));
  return fmtBkkDateISO(d);
}

/**
 * ✅ parse วันที่จากข้อความไทยแบบง่าย ๆ
 * รองรับ:
 * - วันนี้ / พรุ่งนี้ / มะรืน
 * - 29/01, 29 / 1
 * - "จอง 29 ..." / "วันที่ 29" / "วัน 29"
 * - "29 การเงิน ..." (เลขวันขึ้นต้นประโยค)  <-- (ของเดิมบอกว่ารองรับ แต่จริงๆ ยังไม่รองรับ)
 */
export function extractDateISOFromThai(text: string): string | null {
  const t = String(text || "").trim();

  // relative
  if (/วันนี้/.test(t)) return bkkTodayISO();
  if (/พรุ่งนี้/.test(t)) return addDaysISO(bkkTodayISO(), 1);
  if (/มะรืน/.test(t)) return addDaysISO(bkkTodayISO(), 2);

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
  if (m2?.[1]) {
    const dd = Number(m2[1]);
    const { y, m, day } = bkkNowParts();

    if (dd < 1 || dd > 31) return null;

    let yy = y;
    let mm = m;

    // ถ้าพิมพ์ dd ที่น้อยกว่าวันนี้ -> ตีว่าเดือนหน้า (กัน "วันที่ 1" ตอนปลายเดือน)
    if (dd < day) {
      mm += 1;
      if (mm === 13) {
        mm = 1;
        yy += 1;
      }
    }

    if (mm < 1 || mm > 12) return null;
    if (dd > daysInMonth(yy, mm)) return null;

    return `${yy}-${pad2(mm)}-${pad2(dd)}`;
  }

  // "29 การเงิน ..." (เลขวันขึ้นต้นประโยค)
  const m3 = t.match(/^(\d{1,2})\b/);
  if (m3?.[1]) {
    const dd = Number(m3[1]);
    const { y, m, day } = bkkNowParts();
    if (dd < 1 || dd > 31) return null;

    let yy = y;
    let mm = m;

    if (dd < day) {
      mm += 1;
      if (mm === 13) {
        mm = 1;
        yy += 1;
      }
    }

    if (dd > daysInMonth(yy, mm)) return null;
    return `${yy}-${pad2(mm)}-${pad2(dd)}`;
  }

  return null;
}
