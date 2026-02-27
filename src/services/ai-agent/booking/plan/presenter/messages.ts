// src/services/aiAgent/booking/plan/presenter/messages.ts
import { fmtBkkHHMM } from "../utils/time";

const TZ = "Asia/Bangkok";

export function fmtThaiDateLong(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function fmtTimeRangeLabel(timeRange: string) {
  const tr = String(timeRange || "ANY").trim().toUpperCase();
  if (tr === "ANY") return "เวลาใดก็ได้";
  if (tr === "AUTO") return "ระบบเลือกให้";
  return tr;
}

export function topCandidatesText(candidates: any[], limit = 24) {
  const top = (candidates || []).slice(0, limit);
  if (!top.length) return "";
  return top
    .map((s) => {
      const st = fmtBkkHHMM(s.start);
      const en = fmtBkkHHMM(s.end);
      const remain = Number(s.remaining ?? 0);
      return `- ${st}-${en} (เหลือ ${remain})`;
    })
    .join("\n");
}

export function buildProgressCard(input: {
  dateISO: string;
  timeRange: string;
  categoryName?: string | null;
  detailText?: string | null;
  serviceMode?: string | null;
  onlineChannelCode?: string | null;
}) {
  const { dateISO, timeRange, categoryName, detailText, serviceMode, onlineChannelCode } = input;

  const dateLine = `- ✅ **วันที่:** ${fmtThaiDateLong(dateISO)} (${dateISO})`;
  const timeLine = `- ✅ **ช่วงเวลา:** ${fmtTimeRangeLabel(timeRange)}`;

  const catLine = categoryName
    ? `- ✅ **หมวดปัญหา:** ${categoryName}`
    : `- ❌ **หมวดปัญหา:** _ยังไม่ระบุ_`;

  const detailLine =
    detailText && detailText.trim().length >= 5
      ? `- ✅ **ปัญหาโดยย่อ:** “${detailText.trim()}”`
      : `- ❌ **ปัญหาโดยย่อ:** _ยังไม่ระบุ_`;

  let modeLine = "";
  if (serviceMode === "ONLINE") {
    if (onlineChannelCode) {
      modeLine = `- ✅ **รูปแบบการรเข้าพบ:** ออนไลน์ (ผ่าน ${onlineChannelCode})`;
    } else {
      modeLine = `- ❌ **รูปแบบการเข้าพบ:** ออนไลน์ (_ยังไม่ระบุช่องทาง_)`;
    }
  } else if (serviceMode === "ONSITE") {
    modeLine = `- ✅ **รูปแบบการเข้าพบ:** พบที่ศูนย์ (On-site)`;
  } else {
    modeLine = `- ❌ **รูปแบบการเข้าพบ:** _ยังไม่ระบุ_`;
  }

  return [`**📋 สรุปที่ผมเข้าใจตอนนี้:**`, dateLine, timeLine, catLine, detailLine, modeLine].join("\n");
}

export function replyNeedField(args: {
  header: string;
  progress: string;
  ask: string;
  examples?: string[];
  candidates?: any[];
}) {
  const { header, progress, ask, examples = [], candidates = [] } = args;

  const ex =
    examples.length > 0
      ? `\n\n**พิมพ์ตัวอย่างได้เลย**\n${examples.map((x) => `- ${x}`).join("\n")}`
      : "";

  const candText = topCandidatesText(candidates);
  const cand = candText
    ? `\n\n**ช่วงเวลาว่างที่ใกล้เคียง (เลือกได้เลย)**\n${candText}`
    : "";

  return `${header}\n\n${progress}\n\n**ยังขาด:** ${ask}${cand}${ex}`;
}
