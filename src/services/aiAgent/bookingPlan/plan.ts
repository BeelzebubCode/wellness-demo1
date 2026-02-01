// src/services/aiAgent/bookingPlan/plan.ts
import { signToken } from "@/services/aiAgent/token";
import { buildBookingPlanSystemPrompt } from "./prompt";
import { listAvailableSlots, pickBestSlot } from "./slots";
import { timeHintRangeFromThai, fmtBkkHHMM, toMinBkk, addDaysISO } from "./time";
import { normalizePlanDate } from "./guards";
import { callChatLLM, extractJsonFromText, safeParseJson } from "./llm";
import {
  loadProblemCategories,
  categoriesJsonForPrompt,
  allowedCategoryCodes,
  findCategoryByCode,
  mapCategoriesForUi,
  categoryOptions,
} from "./categories";
import { buildProgressCard, replyNeedField, topCandidatesText } from "./format";
import type { BookingPlanResponse, ChatMsg, PlanLLM, AgentQuestion } from "./types";

/* -------------------- msg helpers -------------------- */

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

function userLooksLikeGaveTime(text: string) {
  const t = String(text || "");
  return (
    /\b\d{1,2}:\d{2}\b/.test(t) || // 14:00
    /\b\d{1,2}\s*โมง\b/.test(t) || // 2 โมง
    /เช้า|สาย|บ่าย|เย็น|ค่ำ|เที่ยง/.test(t) // time hint
  );
}

/* -------------------- main -------------------- */

export async function runBookingPlan(input: {
  activeUniversityId: number;
  studentId: number;
  body: any; // {messages|message}
}): Promise<BookingPlanResponse> {
  const { activeUniversityId, studentId, body } = input;

  // 1) collect messages
  const { messages, message } = body ?? {};
  let userMessages: ChatMsg[] = [];

  if (Array.isArray(messages)) userMessages = coerceUserMessages(messages).filter((m) => m.role !== "system");
  else if (typeof message === "string" && message.trim()) userMessages = [{ role: "user", content: message.trim() }];
  else return { reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" };

  const question = lastUserText(userMessages).trim();
  if (!question) return { reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" };

  // 2) load categories (DB = source of truth)
  const cats = await loadProblemCategories();
  const categoriesJson = cats.length ? categoriesJsonForPrompt(cats) : "[]";
  const allowedCodes = allowedCategoryCodes(cats);

  const systemBase: ChatMsg = {
    role: "system",
    content: buildBookingPlanSystemPrompt({ categoriesJson }),
  };

  // 3) call LLM
  const baseURL = (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "qwen2.5:7b";

  let r: Response;
  try {
    r = await callChatLLM({
      baseURL,
      model,
      system: systemBase,
      messages: userMessages,
      timeoutMs: 20000,
    });
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

  // 4) normalize fields
  if (!plan.timeRange) plan.timeRange = "ANY";

  // date normalize (กันบัคเลขวันมั่ว + default today)
  plan.date = normalizePlanDate({ question, planDate: plan.date });

  // override thai hints (เช้า/บ่าย/เย็น)
  const hintedRange = timeHintRangeFromThai(question);
  if (hintedRange) plan.timeRange = hintedRange;

  // ✅ ถ้าผู้ใช้ไม่บอกเวลาเลย -> AUTO (ให้ระบบหาเวลาว่างที่เหมาะสุดเอง)
  const hasTimeHint = userLooksLikeGaveTime(question) || !!hintedRange;
  if (!hasTimeHint) {
    plan.timeRange = "AUTO";
  }

  // validate category code against allowed list (กัน LLM มั่ว)
  if (plan.problemCategoryCode && !allowedCodes.has(String(plan.problemCategoryCode))) {
    plan.problemCategoryCode = null;
  }

  // ✅ ถ้าเป็น AUTO/ANY -> กันเวลาที่ผ่านมาแล้ว (วันนี้) ด้วย now+15 นาที
  const trUpper = String(plan.timeRange || "ANY").toUpperCase();
  const isAutoLike = trUpper === "AUTO" || trUpper === "ANY";
  const minStartMinBkk = isAutoLike ? toMinBkk(new Date().toISOString()) + 15 : undefined;

  // 5) slots (วันนี้ก่อน)
  let candidates = await listAvailableSlots({
    universityId: activeUniversityId,
    date: plan.date!,
    limit: 8,
    minStartMinBkk,
  });

  // ✅ ถ้า AUTO แล้ววันนี้ไม่เหลือ -> ขยับไป “พรุ่งนี้” อัตโนมัติ
  if (!candidates.length && trUpper === "AUTO") {
    const tomorrowISO = addDaysISO(plan.date!, 1);
    plan.date = tomorrowISO;
    candidates = await listAvailableSlots({
      universityId: activeUniversityId,
      date: plan.date!,
      limit: 8,
      // พรุ่งนี้ไม่ต้อง minStart
    });
  }

  if (!candidates.length) {
    const progress = buildProgressCard({
      dateISO: plan.date!,
      timeRange: plan.timeRange!,
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

  const suggested = pickBestSlot(candidates, plan.timeRange!);

  // 6) ask timeRange if cannot pick (จริง ๆ AUTO/ANY จะ pick ได้เสมอ)
  if (!suggested?.timeSlotId) {
    const progress = buildProgressCard({
      dateISO: plan.date!,
      timeRange: plan.timeRange!,
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

  // 7) category resolve
  const cat = findCategoryByCode(cats, plan.problemCategoryCode);

  if (!cat) {
    const progress = buildProgressCard({
      dateISO: plan.date!,
      timeRange: plan.timeRange!,
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

  // 8) detail
  const brief = String(plan.detailText || "").trim();
  if (brief.length < 5) {
    const progress = buildProgressCard({
      dateISO: plan.date!,
      timeRange: plan.timeRange!,
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

  // 9) payload
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

  const progress = buildProgressCard({
    dateISO: plan.date!,
    timeRange: suggestedRange!,
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
