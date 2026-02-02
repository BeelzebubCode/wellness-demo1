// src/services/aiAgent/booking/plan/engine.ts
import type { ChatMsg, AgentQuestion } from "@/services/aiAgent/core";
import { signConfirmToken } from "@/services/aiAgent/core";

import type { BookingPlanResponse, PlanLLM } from "./types";

import { getBookingWindow, isOutOfWindow } from "./domain/window";
import { DEFAULT_SERVICE_HOURS, isOutOfServiceTime, serviceHoursText } from "./domain/serviceHours";
import { decideTimeRange } from "./domain/timeRange";

import { normalizePlanDate, userLooksLikeGaveDate } from "./utils/guards";
import { addDaysISO, bkkTodayISO, fmtBkkHHMM, toMinBkk } from "./utils/time";

import {
  loadProblemCategories,
  categoriesJsonForPrompt,
  allowedCategoryCodes,
  findCategoryByCode,
  mapCategoriesForUi,
  categoryOptions,
  detectCategoryFromText,
  guessCategoryFromBrief,
} from "./adapters/categoriesRepo";

import {
  listAvailableSlots,
  pickBestSlot,
  filterSlotsByTimeRange,
} from "./adapters/slotsRepo";

import { callPlannerLLM } from "./adapters/planner";

import { buildProgressCard, replyNeedField, topCandidatesText } from "./presenter/messages";

type Deps = {
  maxBookAheadDays: number;
  aiBaseURL: string;
  aiModel: string;
};

export class BookingPlanEngine {
  constructor(private deps: Deps) {}

  async run(input: {
    activeUniversityId: number;
    studentId: number;
    body: any;
  }): Promise<BookingPlanResponse> {
    const { activeUniversityId, studentId, body } = input;

    const userMessages = this.collectMessages(body);
    const question = this.lastUserText(userMessages).trim();
    if (!question) return { reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" };

    // categories
    const cats = await loadProblemCategories();
    const categoriesJson = cats.length ? categoriesJsonForPrompt(cats) : "[]";
    const allowedCodes = allowedCategoryCodes(cats);

    // window + hours
    const window = getBookingWindow(this.deps.maxBookAheadDays);
    const hours = DEFAULT_SERVICE_HOURS;

    // LLM → plan
    const plan = await callPlannerLLM({
      baseURL: this.deps.aiBaseURL,
      model: this.deps.aiModel,
      userMessages,
      categoriesJson,
      bookingWindow: window,
    });

    if (!plan) {
      return {
        reply: "ผมอ่านแผนจองจาก AI ไม่ได้ ลองพิมพ์ใหม่เช่น “จองพรุ่งนี้ 09:00 เรื่องความเครียด”",
      };
    }

    // --------------------------
    // 🎯 TimeRange (single truth)
    // --------------------------
    const { userTimeHint, decision } = decideTimeRange({
      question,
      serviceOpenMin: hours.openMin,
      serviceCloseMin: hours.closeMin,
    });

    if (decision.kind === "RANGE") {
      plan.timeRange = decision.value;

      // ✅ HARD STOP: อยู่นอกเวลาบริการ
      if (isOutOfServiceTime(plan.timeRange, hours)) {
        return {
          reply:
            `⛔ **เวลา ${plan.timeRange} อยู่นอกช่วงให้บริการครับ**\n\n` +
            `🕗 ระบบเปิดให้จองเฉพาะ:\n` +
            `${serviceHoursText(hours)}\n\n` +
            `✍️ กรุณาพิมพ์เวลาใหม่ที่ต้องการ`,
          state: plan,
          candidates: [],
          missingFields: ["timeRange"],
          questions: [{ field: "timeRange", text: "ต้องการจองช่วงเวลาไหนครับ?" }],
        };
      }
    } else if (decision.kind === "NEED_REASK") {
      return {
        reply:
          `⛔ **ผมยังไม่เข้าใจเวลาที่พิมพ์มาครับ**\n\n` +
          `✍️ กรุณาพิมพ์เวลาในรูปแบบที่ชัดเจน เช่น:\n` +
          `• 10:00\n• 10:00-11:00\n• พรุ่งนี้ 09:00`,
        state: plan,
        candidates: [],
        missingFields: ["timeRange"],
        questions: [{ field: "timeRange", text: "ต้องการจองช่วงเวลาไหนครับ?" }],
      };
    } else {
      plan.timeRange = "AUTO";
    }

    // --------------------------
    // 🗓️ Date normalization
    // --------------------------
    plan.date = normalizePlanDate({ question, planDate: plan.date });

    if (!userLooksLikeGaveDate(question)) {
      plan.date = window.minISO;
    }

    if (plan.date && isOutOfWindow(plan.date, window)) {
      return this.replyOutOfWindow(plan, window);
    }

    // --------------------------
    // 🧩 Category
    // --------------------------
    const overrideCat = detectCategoryFromText(cats, question);
    if (overrideCat) plan.problemCategoryCode = overrideCat.problem_category_code;

    if (plan.problemCategoryCode && !allowedCodes.has(String(plan.problemCategoryCode))) {
      plan.problemCategoryCode = null;
    }

    // --------------------------
    // 🧠 Slots
    // --------------------------
    const trUpper = String(plan.timeRange || "ANY").toUpperCase();

    // ถ้า AUTO/ANY → กันเคส "วันนี้" แล้วใกล้เวลาปัจจุบันเกินไป
    const minStartMinBkk =
      trUpper === "AUTO" || trUpper === "ANY"
        ? toMinBkk(new Date().toISOString()) + 15
        : undefined;

    let candidates = await listAvailableSlots({
      universityId: activeUniversityId,
      date: plan.date!,
      limit: 8,
      minStartMinBkk,
    });

    // date explicit but empty => try next in window
    if (!candidates.length && userLooksLikeGaveDate(question)) {
      const nextDate = await this.findNextDateWithSlotsInWindow(
        activeUniversityId,
        plan.date!,
        window,
      );

      const progress = buildProgressCard({
        dateISO: plan.date!,
        timeRange: this.toDisplayTimeRange(plan.timeRange),
        categoryName: null,
        detailText: plan.detailText,
      });

      return {
        reply:
          `😕 **วัน${plan.date} ไม่มีคิวว่างแล้วครับ**\n\n` +
          progress +
          (nextDate
            ? `\n\n✅ วันถัดไปที่ยังพอมีคิวว่าง: **${nextDate}**\nพิมพ์ “${nextDate}” เพื่อให้ผมหาช่วงที่เหมาะสุดให้ได้เลย`
            : `\n\n⚠️ ช่วงวันที่เปิดให้จอง (${window.minISO} ถึง ${window.maxISO}) ตอนนี้ไม่มีคิวว่างแล้วครับ`) +
          `\n\nลองพิมพ์วันใหม่ เช่น “พรุ่งนี้” หรือ “${window.maxISO}”`,
        state: plan,
        candidates: [],
      };
    }

    // AUTO move forward (still in window)
    if (!candidates.length && trUpper === "AUTO") {
      const nextISO = addDaysISO(plan.date!, 1);
      if (!isOutOfWindow(nextISO, window)) {
        plan.date = nextISO;
        candidates = await listAvailableSlots({
          universityId: activeUniversityId,
          date: plan.date!,
          limit: 8,
        });
      }
    }

    if (!candidates.length) {
      const progress = buildProgressCard({
        dateISO: plan.date!,
        timeRange: this.toDisplayTimeRange(plan.timeRange),
        categoryName: null,
        detailText: plan.detailText,
      });

      return {
        reply:
          `😕 **ไม่พบช่วงเวลาว่างในวันที่เลือก**\n\n` +
          progress +
          `\n\nลองพิมพ์วันใหม่ เช่น “พรุ่งนี้” หรือ “${window.maxISO}”`,
        state: plan,
        candidates: [],
      };
    }

    // strict time if user asked time (and not AUTO/ANY)
    let strictCandidates = candidates;
    if (userTimeHint && !(trUpper === "AUTO" || trUpper === "ANY")) {
      strictCandidates = filterSlotsByTimeRange(candidates, plan.timeRange!);
    }

    if (
      userTimeHint &&
      !(trUpper === "AUTO" || trUpper === "ANY") &&
      strictCandidates.length === 0
    ) {
      return {
        reply:
          `😕 **ช่วงเวลา ${plan.timeRange} ไม่มีคิวให้บริการครับ**\n\n` +
          `เวลาที่เปิดให้จองวันนี้คือ:\n` +
          topCandidatesText(candidates, 5) +
          `\n\n✍️ พิมพ์เวลาใหม่ที่ต้องการได้เลยครับ`,
        state: plan,
        candidates,
        missingFields: ["timeRange"],
        questions: [{ field: "timeRange", text: "อยากเปลี่ยนเป็นช่วงเวลาไหนครับ?" }],
      };
    }

    const pool = strictCandidates.length ? strictCandidates : candidates;
    const suggested = pickBestSlot(pool, plan.timeRange!);

    if (!suggested?.timeSlotId) {
      const progress = buildProgressCard({
        dateISO: plan.date!,
        timeRange: this.toDisplayTimeRange(plan.timeRange),
        categoryName: null,
        detailText: plan.detailText,
      });

      const q: AgentQuestion = {
        field: "timeRange",
        text: "อยากจองช่วงเวลาไหนครับ? (เลือก 1 ชั่วโมง) เช่น 08:00-09:00 หรือพิมพ์ 09:00",
      };

      return {
        reply: replyNeedField({
          header: "⏰ **ขอเวลาที่ต้องการอีกนิดครับ**",
          progress,
          ask: "ช่วงเวลา (เช่น 08:00-09:00 หรือพิมพ์ 09:00)",
          examples: ["พรุ่งนี้ 09:00 ความเครียด", "10:00-11:00 นอนไม่หลับ"],
          candidates,
        }),
        state: plan,
        candidates,
        missingFields: ["timeRange"],
        questions: [q],
      };
    }

    // convert AUTO to real range
    const selectedRange =
      suggested?.start && suggested?.end
        ? `${fmtBkkHHMM(suggested.start)}-${fmtBkkHHMM(suggested.end)}`
        : plan.timeRange;

    plan.timeRange = selectedRange || plan.timeRange;

    // category guess from brief
    const briefMaybe = String(plan.detailText || "").trim();
    if (!plan.problemCategoryCode && briefMaybe.length >= 5) {
      const guessed = guessCategoryFromBrief(cats, briefMaybe);
      if (guessed) plan.problemCategoryCode = guessed.problem_category_code;
    }

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
        state: plan,
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
        state: plan,
        candidates,
        categories: mapCategoriesForUi(cats),
        missingFields: ["detailText"],
        questions: [q],
      };
    }

    // --------------------------
    // ✅ confirm token (core)
    // --------------------------
    const payload = {
      v: 1,
      exp: Date.now() + 5 * 60 * 1000,
      action: "BOOK",
      universityId: activeUniversityId,
      studentId,
      timeSlotId: suggested.timeSlotId,
      problemCategoryId: cat.problem_category_id,
      detailText: brief,
    };

    const confirmToken = signConfirmToken(payload);

    const progress = buildProgressCard({
      dateISO: plan.date!,
      timeRange: plan.timeRange!,
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
      state: plan,
      candidates,
      suggested,
      confirmToken,
      missingFields: [],
      questions: [],
    };
  }

  // -------------------- internal helpers --------------------

  private collectMessages(body: any): ChatMsg[] {
    const { messages, message } = body ?? {};
    if (Array.isArray(messages)) {
      return messages
        .filter((m: any) => m && typeof m.role === "string" && typeof m.content === "string")
        .filter((m: any) => m.role === "user" || m.role === "assistant" || m.role === "system")
        .filter((m: any) => m.role !== "system")
        .map((m: any) => ({ role: m.role, content: m.content }));
    }

    if (typeof message === "string" && message.trim())
      return [{ role: "user", content: message.trim() }];

    return [];
  }

  private lastUserText(msgs: ChatMsg[]) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i]?.role === "user") return msgs[i].content || "";
    }
    return "";
  }

  private toDisplayTimeRange(tr: string | null | undefined) {
    const u = String(tr || "").toUpperCase();
    if (u === "AUTO") return "ระบบเลือกให้";
    if (!tr) return "ไม่ระบุ";
    return tr;
  }

  private replyOutOfWindow(plan: PlanLLM, window: { minISO: string; maxISO: string; minDays: number; maxDays: number }) {
    const progress = buildProgressCard({
      dateISO: plan.date!,
      timeRange: this.toDisplayTimeRange(plan.timeRange),
      categoryName: null,
      detailText: plan.detailText,
    });

    return {
      reply:
        `🚫 **วัน${plan.date} อยู่นอกช่วงที่เปิดให้จองครับ**\n\n` +
        `ตอนนี้ระบบเปิดให้จองล่วงหน้าได้ **${window.minDays}-${window.maxDays} วัน**\n` +
        `ตั้งแต่ **${window.minISO}** ถึง **${window.maxISO}**\n\n` +
        progress +
        `\n\nลองพิมพ์วันใหม่ เช่น “พรุ่งนี้” หรือ “${window.maxISO}”`,
      state: plan,
      candidates: [],
    } as BookingPlanResponse;
  }

  private async findNextDateWithSlotsInWindow(
    universityId: number,
    fromDateISO: string,
    window: { minISO: string; maxISO: string },
  ) {
    let cur = fromDateISO;
    while (true) {
      cur = addDaysISO(cur, 1);
      if (String(cur) < String(window.minISO)) continue;
      if (String(cur) > String(window.maxISO)) break;

      const slots = await listAvailableSlots({ universityId, date: cur, limit: 1 });
      if (slots.length) return cur;
    }
    return null;
  }
}
