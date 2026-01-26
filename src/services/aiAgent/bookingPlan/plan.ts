// src/services/aiAgent/bookingPlan/plan.ts
import prisma from "@/lib/prisma";
import { signToken } from "@/services/aiAgent/token";
import { buildBookingPlanSystemPrompt } from "./prompt";
import {
  bkkTodayISO,
  isISODate,
  isPastDateISO,
  timeHintRangeFromThai,
  fmtBkkHHMM,
  extractDateISOFromThai,
} from "./time";
import { listAvailableSlots, pickBestSlot } from "./slots";
import type { BookingPlanResponse, ChatMsg, PlanLLM, AgentQuestion } from "./types";

const TZ = "Asia/Bangkok";

/* -------------------- Pretty format helpers -------------------- */

function fmtThaiDateLong(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function fmtTimeRangeLabel(timeRange: string) {
  const tr = String(timeRange || "ANY").trim().toUpperCase();
  if (tr === "ANY") return "เวลาใดก็ได้";
  return tr;
}

function topCandidatesText(candidates: any[], limit = 3) {
  const top = (candidates || []).slice(0, limit);
  if (!top.length) return "";
  const lines = top.map((s) => {
    const st = fmtBkkHHMM(s.start);
    const en = fmtBkkHHMM(s.end);
    const remain = Number(s.remaining ?? 0);
    return `- ${st}-${en} (เหลือ ${remain})`;
  });
  return lines.join("\n");
}

function buildProgressCard(input: {
  dateISO: string;
  timeRange: string;
  categoryName?: string | null;
  detailText?: string | null;
}) {
  const { dateISO, timeRange, categoryName, detailText } = input;

  const dateLine = `✅ วันที่: **${fmtThaiDateLong(dateISO)}** (${dateISO})`;
  const timeLine = `✅ ช่วงเวลา: **${fmtTimeRangeLabel(timeRange)}**`;

  const catLine = categoryName
    ? `✅ หมวดปัญหา: **${categoryName}**`
    : `❌ หมวดปัญหา: _ยังไม่ระบุ_`;

  const detailLine =
    detailText && detailText.trim().length >= 5
      ? `✅ ปัญหาโดยย่อ: “${detailText.trim()}”`
      : `❌ ปัญหาโดยย่อ: _ยังไม่ระบุ_`;

  return [
    `**สรุปที่ผมเข้าใจตอนนี้**`,
    dateLine,
    timeLine,
    catLine,
    detailLine,
  ].join("\n");
}

function replyNeedField(args: {
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

  const candText = topCandidatesText(candidates, 3);
  const cand = candText
    ? `\n\n**ช่วงเวลาว่างที่ใกล้เคียง (เลือกได้เลย)**\n${candText}`
    : "";

  return `${header}\n\n${progress}\n\n**ยังขาด:** ${ask}${cand}${ex}`;
}

/**
 * ✅ กันบัค: ห้ามจับเลขวันมั่ว
 * - จะยอม "override plan.date" จากข้อความ ก็ต่อเมื่อข้อความดูเหมือนระบุวันจริงๆ
 * - ป้องกันกรณีผู้ใช้พิมพ์ "เครียด 27 อย่าง..." แล้วโดนตีเป็นวันที่ 27
 */
function userLooksLikeGaveDate(text: string) {
  const t = String(text || "").trim();
  return (
    /วันนี้|พรุ่งนี้|มะรืน/.test(t) ||
    /\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(t) || // 29/01
    /(?:จอง|วันที่|วัน)\s*\d{1,2}\b/.test(t) // จอง 29 / วันที่ 29
  );
}

/* -------------------- misc helpers -------------------- */

function coerceUserMessages(input: any): ChatMsg[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, content: m.content }) as ChatMsg);
}

function lastUserText(msgs: ChatMsg[]) {
  for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i]?.role === "user") return msgs[i].content || "";
  return "";
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function extractJsonFromText(text: string) {
  const t = String(text || "");
  const fenced = t.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const obj = t.match(/\{[\s\S]*\}/);
  if (obj?.[0]) return obj[0].trim();
  return "";
}

function safeParseJson<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function mapCategoriesForUi(cats: any[]) {
  return cats.map((c) => ({
    id: c.problem_category_id,
    code: c.problem_category_code,
    name: c.problem_category_name_th,
  }));
}

function categoryOptions(cats: any[]) {
  return cats.map((c) => ({
    value: c.problem_category_id,
    code: c.problem_category_code,
    label: c.problem_category_name_th,
  }));
}

/* -------------------- main -------------------- */

export async function runBookingPlan(input: {
  activeUniversityId: number;
  studentId: number;
  body: any; // {messages|message}
}): Promise<BookingPlanResponse> {
  const { activeUniversityId, studentId, body } = input;

  const { messages, message } = body ?? {};
  let userMessages: ChatMsg[] = [];

  if (Array.isArray(messages))
    userMessages = coerceUserMessages(messages).filter((m) => m.role !== "system");
  else if (typeof message === "string" && message.trim())
    userMessages = [{ role: "user", content: message.trim() }];
  else
    return { reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" };

  const question = lastUserText(userMessages).trim();
  if (!question) return { reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" };

  // categories
  const cats = await prisma.problemCategory.findMany({
    orderBy: { problem_category_name_th: "asc" },
    select: {
      problem_category_id: true,
      problem_category_code: true,
      problem_category_name_th: true,
    },
    take: 200,
  });

  const categoriesText =
    cats.length > 0
      ? cats.map((c) => `- ${c.problem_category_code}: ${c.problem_category_name_th}`).join("\n")
      : "- (ไม่พบหมวดปัญหาในระบบ)";

  const systemBase: ChatMsg = {
    role: "system",
    content: buildBookingPlanSystemPrompt({ categoriesText }),
  };

  // call LLM
  const baseURL = (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "qwen2.5:7b";

  let r: Response;
  try {
    r = await fetchWithTimeout(
      `${baseURL}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [systemBase, ...userMessages],
          options: { temperature: 0.2 },
        }),
      },
      20000,
    );
  } catch (e: any) {
    const isAbort = String(e?.name) === "AbortError";
    return {
      reply: isAbort
        ? "ระบบตอบช้ากว่าปกติ ลองใหม่อีกครั้งนะครับ 🙏"
        : "เชื่อมต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้งนะครับ",
    };
  }

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    return {
      reply: "ขอโทษครับ ตอนนี้วางแผนจองไม่ได้ ลองใหม่อีกครั้ง",
      debug: { status: r.status, detail: t.slice(0, 200) },
    };
  }

  const data = await r.json().catch(() => ({} as any));
  const content = String(data?.message?.content ?? "").trim();

  const planJson = extractJsonFromText(content);
  const plan = safeParseJson<PlanLLM>(planJson);

  if (!plan) {
    return {
      reply: "ผมอ่านแผนจองจาก AI ไม่ได้ ลองพิมพ์ใหม่เช่น “จองพรุ่งนี้ 14:00 เรื่องความเครียด”",
    };
  }

  // normalize timeRange
  if (!plan.timeRange) plan.timeRange = "ANY";

  // ✅ override date เฉพาะเมื่อ user ดูเหมือนระบุวันจริงๆ (กันบัคจอง 27)
  const explicitDate = extractDateISOFromThai(question);
  if (explicitDate && userLooksLikeGaveDate(question)) {
    plan.date = explicitDate;
  }

  // validate date format
  if (plan.date && !isISODate(plan.date)) {
    plan.date = null;
  }

  // ✅ ถ้ายังไม่มีวันจริงๆ ให้ default เป็น “วันนี้”
  if (!plan.date) {
    plan.date = bkkTodayISO();
  }

  // no past date
  if (plan.date && isPastDateISO(plan.date)) {
    plan.date = bkkTodayISO();
  }

  // override thai hints
  const hintedRange = timeHintRangeFromThai(question);
  if (hintedRange) plan.timeRange = hintedRange;

  // slots
  const candidates = await listAvailableSlots({
    universityId: activeUniversityId,
    date: plan.date,
    limit: 8,
  });

  if (!candidates.length) {
    const progress = buildProgressCard({
      dateISO: plan.date,
      timeRange: plan.timeRange,
      categoryName: null,
      detailText: plan.detailText,
    });

    return {
      reply:
        `😕 **ไม่พบช่วงเวลาว่างในวันที่เลือก**\n\n` +
        progress +
        `\n\nลองพิมพ์วันใหม่ เช่น “พรุ่งนี้” หรือ “29/01”`,
      plan,
      candidates: [],
    };
  }

  const suggested = pickBestSlot(candidates, plan.timeRange);

  if (!suggested?.timeSlotId) {
    const progress = buildProgressCard({
      dateISO: plan.date,
      timeRange: plan.timeRange,
      categoryName: null,
      detailText: plan.detailText,
    });

    const q: AgentQuestion = {
      field: "timeRange",
      text: "อยากจองช่วงเวลาไหนครับ? (เลือก 1 ชั่วโมง) เช่น 13:00-14:00 หรือพิมพ์ 14:00",
    };

    return {
      reply: replyNeedField({
        header: "⏰ **ขอเวลาที่ต้องการอีกนิดครับ**",
        progress,
        ask: "ช่วงเวลา (เช่น 13:00-14:00 หรือพิมพ์ 14:00)",
        examples: ["29 14:00 ความเครียด", "พรุ่งนี้ 10:00-11:00 นอนไม่หลับ"],
        candidates,
      }),
      plan,
      candidates,
      missingFields: ["timeRange"],
      questions: [q],
    };
  }

  // category
  const cat = plan.problemCategoryCode
    ? cats.find((c) => String(c.problem_category_code) === String(plan.problemCategoryCode))
    : null;

  if (!cat) {
    const progress = buildProgressCard({
      dateISO: plan.date,
      timeRange: plan.timeRange,
      categoryName: null,
      detailText: plan.detailText,
    });

    const q: AgentQuestion = {
      field: "problemCategoryId",
      text: "ต้องการปรึกษาเรื่องอะไร?",
      options: categoryOptions(cats),
    };

    return {
      reply: replyNeedField({
        header: "📌 **ขาดข้อมูล 1 อย่างก่อนยืนยันได้ครับ**",
        progress,
        ask: "หมวดปัญหา",
        examples: ["ความเครียด", "ความสัมพันธ์", "การเรียน"],
        candidates,
      }),
      plan,
      candidates,
      categories: mapCategoriesForUi(cats),
      missingFields: ["problemCategoryId"],
      questions: [q],
    };
  }

  // detail
  const brief = String(plan.detailText || "").trim();
  if (brief.length < 5) {
    const progress = buildProgressCard({
      dateISO: plan.date,
      timeRange: plan.timeRange,
      categoryName: cat.problem_category_name_th,
      detailText: plan.detailText,
    });

    const q: AgentQuestion = {
      field: "detailText",
      text: "ขอปัญหาโดยย่อ (สั้น ๆ) เพื่อส่งให้ผู้ให้คำปรึกษาครับ เช่น “เครียดเรื่องเรียน/นอนไม่หลับ”",
    };

    return {
      reply: replyNeedField({
        header: "📝 **ขอรายละเอียดสั้น ๆ อีกนิดครับ**",
        progress,
        ask: "ปัญหาโดยย่อ (อย่างน้อย 1 ประโยค)",
        examples: ["เครียดเรื่องเรียน นอนไม่หลับ", "มีปัญหากับเพื่อนในห้อง"],
        candidates,
      }),
      plan,
      candidates,
      categories: mapCategoriesForUi(cats),
      missingFields: ["detailText"],
      questions: [q],
    };
  }

  // payload
  const payload = {
    v: 1,
    exp: Date.now() + 5 * 60 * 1000,
    action: "BOOK" as const,
    universityId: activeUniversityId,
    studentId,
    timeSlotId: suggested.timeSlotId,
    problemCategoryId: cat.problem_category_id,
    detailText: brief,
  };

  const confirmToken = signToken(payload);

  const suggestedRange =
    suggested?.start && suggested?.end
      ? `${fmtBkkHHMM(suggested.start)}-${fmtBkkHHMM(suggested.end)}`
      : plan.timeRange;

  // ✅ ทำ reply พร้อมยืนยันให้ “สวย”
  const progress = buildProgressCard({
    dateISO: plan.date,
    timeRange: suggestedRange,
    categoryName: cat.problem_category_name_th,
    detailText: brief,
  });

  const others = topCandidatesText(candidates, 3);

  return {
    reply:
      `✅ **พร้อมยืนยันการจองแล้วครับ**\n\n` +
      progress +
      (others ? `\n\n**ช่วงว่างอื่น ๆ (ถ้าอยากเปลี่ยน)**\n${others}` : "") +
      `\n\nถ้าถูกต้อง กด **“ยืนยันการจอง”** ได้เลย`,
    plan,
    candidates,
    suggested,
    confirmToken,
    missingFields: [],
    questions: [],
  };
}
