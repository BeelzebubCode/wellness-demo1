// src/services/aiAgent/booking/plan/engine.ts
import type { ChatMsg, AgentQuestion } from "@/services/ai-agent/core";
import { signConfirmToken } from "@/services/ai-agent/core";

import type { BookingPlanResponse, PlanLLM } from "./types";

import { getBookingWindow, isOutOfWindow } from "./domain/window";
import { DEFAULT_SERVICE_HOURS, isOutOfServiceTime, serviceHoursText } from "./domain/serviceHours";
import { decideTimeRange } from "./domain/timeRange";

import { normalizePlanDate, userLooksLikeGaveDate } from "./utils/guards";
import { addDaysISO, fmtBkkHHMM, toMinBkk } from "./utils/time";

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

import { loadOnlineChannels } from "./adapters/channelsRepo";

import { callPlannerLLM } from "./adapters/planner";

import { buildProgressCard, replyNeedField, topCandidatesText } from "./presenter/messages";

type Deps = {
  maxBookAheadDays: number;
  aiBaseURL: string;
  aiModel: string;
};

export class BookingPlanEngine {
  constructor(private deps: Deps) { }

  async run(input: {
    activeUniversityId: number;
    studentId: number;
    body: any;
  }): Promise<BookingPlanResponse> {
    const { activeUniversityId, studentId, body } = input;

    const userMessages = this.collectMessages(body);
    // Normalize dot-format times: "12.00" → "12:00", "12.30" → "12:30"
    const rawQuestion = this.lastUserText(userMessages).trim();
    const question = rawQuestion.replace(/(\d{1,2})\.(\d{2})(?!\d)/g, "$1:$2");
    if (!question) return { reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" };

    // categories & channels
    const cats = await loadProblemCategories();
    const categoriesJson = cats.length ? categoriesJsonForPrompt(cats) : "[]";
    const allowedCodes = allowedCategoryCodes(cats);

    const channels = await loadOnlineChannels();

    // window + hours
    const window = getBookingWindow(this.deps.maxBookAheadDays);
    const hours = DEFAULT_SERVICE_HOURS;

    // LLM → plan
    const llmPlan = await callPlannerLLM({
      baseURL: this.deps.aiBaseURL,
      model: this.deps.aiModel,
      userMessages,
      categoriesJson,
      bookingWindow: window,
    });

    if (!llmPlan) {
      // ✅ Graceful fallback — ถ้า LLM อ่านไม่ออก (เช่น user พิมพ์แค่ "จอง") ให้ treat เป็น empty plan
      // แทนที่จะ return error ซึ่งทำให้ UX แย่
    }

    // ✅ Merge with previous state (Fix "Amnesia")
    // llmPlan may be null when user sends short intent like "จอง" — treat as empty plan
    const safePlan = llmPlan ?? ({} as Partial<PlanLLM>);
    const prevPlan = body.plan as PlanLLM | undefined;
    const plan: PlanLLM = {
      intent: safePlan.intent ?? prevPlan?.intent ?? "BOOK",
      date: safePlan.date ?? prevPlan?.date ?? null,
      timeRange: safePlan.timeRange ?? prevPlan?.timeRange ?? null,
      problemCategoryCode: safePlan.problemCategoryCode ?? prevPlan?.problemCategoryCode ?? null,
      // ⛔ detailText: ALWAYS ignore LLM — user must type it themselves.
      // If we were waiting for it (prevPlan has category but no detailText),
      // use the raw user message directly.
      detailText: prevPlan?.detailText
        ? prevPlan.detailText
        : (prevPlan?.problemCategoryCode && !prevPlan?.detailText && question.length >= 3)
          ? question   // User's raw answer to the detailText question
          : null,
      serviceMode: safePlan.serviceMode ?? prevPlan?.serviceMode ?? null,
      onlineChannelCode: safePlan.onlineChannelCode ?? prevPlan?.onlineChannelCode ?? null,
    };


    // ═══════════════════════════════════════════════════════════════════
    // 🔄 Smart Reset Triggers — detect user's intent to CHANGE a field
    // If fuzzy-matched, reset the field so the engine re-asks with UI
    // ═══════════════════════════════════════════════════════════════════
    const qLow = question.toLowerCase().replace(/\s+/g, "");

    // --- Service Mode change: ONLINE ↔ ONSITE ---
    const wantsOnsite = /ออนไซ|on.?site|พบที่ศูนย์|ไปศูนย์|เจอตัว|พบตัว|เปลี่ยน.*(?:ออนไซ|on.?site|พบ)/i.test(question);
    const wantsOnline = /ออนไลน์|on.?line|คุย.*ออนไลน์|เปลี่ยน.*(?:ออนไลน์|on.?line)/i.test(question);
    const wantsChangeServiceMode = /เปลี่ยน.*(?:รูปแบบ|ประเภท.*เข้าพบ|การเข้าพบ|วิธี.*เข้าพบ|mode)/i.test(question);

    if (wantsOnsite && plan.serviceMode !== "ONSITE") {
      plan.serviceMode = "ONSITE";
      plan.onlineChannelCode = null; // onsite doesn't need channel
    } else if (wantsOnline && plan.serviceMode !== "ONLINE") {
      plan.serviceMode = "ONLINE";
      plan.onlineChannelCode = null; // need to pick channel
    } else if (wantsChangeServiceMode) {
      plan.serviceMode = null;
      plan.onlineChannelCode = null;
    }

    // --- Online Channel change ---
    if (/เปลี่ยน.*ช่องทาง|เปลี่ยน.*channel/i.test(question)) {
      plan.onlineChannelCode = null;
    }

    // --- Problem Category change ---
    if (/เปลี่ยน.*(?:ประเภท.*ปัญหา|หมวด.*ปัญหา|ปัญหา.*ประเภท|category)/i.test(question)) {
      plan.problemCategoryCode = null;
      plan.detailText = null; // reset detail too since category changed
    }

    // --- Date/Time change ---
    if (/เปลี่ยน.*(?:วัน|เวลา|ช่วง|date|time)/i.test(question)) {
      if (/เปลี่ยน.*วัน|เปลี่ยน.*date/i.test(question)) plan.date = null;
      if (/เปลี่ยน.*เวลา|เปลี่ยน.*ช่วง|เปลี่ยน.*time/i.test(question)) {
        plan.timeRange = null;
        // Re-apply LLM's new timeRange if it parsed one from the same question
        if (safePlan.timeRange) plan.timeRange = safePlan.timeRange;
      }
    }

    // --- DetailText change ---
    if (/เปลี่ยน.*(?:ปัญหาโดยย่อ|รายละเอียด|detail)/i.test(question)) {
      plan.detailText = null;
    }

    // --------------------------
    // 🎯 TimeRange (single truth)
    // --------------------------
    // --------------------------
    // 🎯 TimeRange (LLM > Regex)
    // --------------------------
    const llmTimeValid = plan.timeRange && /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(plan.timeRange);
    let userTimeHint = !!llmTimeValid;

    // If LLM already resolved a valid range (e.g. from "บ่าย 2" -> "14:00-15:00"), use it.
    if (!llmTimeValid) {
      const { userTimeHint: hint, decision } = decideTimeRange({
        question,
        serviceOpenMin: hours.openMin,
        serviceCloseMin: hours.closeMin,
      });

      userTimeHint = hint;

      if (decision.kind === "RANGE") {
        plan.timeRange = decision.value;
      } else if (decision.kind === "NEED_REASK") {
        // Only error if we really have no idea.
        // But if LLM sent something invalid, we might want to ask.
        // For now, if LLM failed and regex failed -> Ask.
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
        // AUTO
        // If we kept previous plan timeRange, it is effectively valid?
        if (!plan.timeRange) plan.timeRange = "AUTO";
      }
    }

    // ✅ Match check check service hours
    if (plan.timeRange && plan.timeRange !== "AUTO" && isOutOfServiceTime(plan.timeRange, hours)) {
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

    // --------------------------
    // 🗓️ Date normalization
    // --------------------------
    plan.date = normalizePlanDate({ question, planDate: plan.date });

    if (!userLooksLikeGaveDate(question)) {
      // ✅ Auto-bump to tomorrow if today is nearly over
      // (If current time is > closeMin - 30 mins, assume user wants tomorrow)
      const nowMin = toMinBkk(new Date().toISOString());
      const cutoff = hours.closeMin - 30; // buffer before closing

      if (nowMin >= cutoff) {
        plan.date = addDaysISO(window.minISO, 1);
      } else {
        plan.date = window.minISO;
      }
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
      limit: 24,
      minStartMinBkk,
    });

    // date explicit but empty => try next in window
    if (!candidates.length && userLooksLikeGaveDate(question)) {
      const nextDate = await this.findNextDateWithSlotsInWindow(
        activeUniversityId,
        plan.date!,
        window,
      );

      let nextSlotsText = "";
      if (nextDate) {
        const nextSlots = await listAvailableSlots({
          universityId: activeUniversityId,
          date: nextDate,
          limit: 5,
        });
        nextSlotsText = topCandidatesText(nextSlots, 5);
      }

      const _progress = buildProgressCard({
        dateISO: plan.date!,
        timeRange: this.toDisplayTimeRange(plan.timeRange),
        categoryName: null,
        detailText: plan.detailText,
        serviceMode: plan.serviceMode,
        onlineChannelCode: plan.onlineChannelCode,
      });

      return {
        reply:
          `😕 **วัน ${plan.date} คิวเต็มแล้วครับ**\n\n` +
          (nextDate
            ? `✅ **แนะนำคิวว่างที่ใกล้ที่สุด:**\n` +
            `📅 **${nextDate}**\n` +
            `${nextSlotsText}\n\n` +
            `✍️ พิมพ์เวลาที่ต้องการจองได้เลย (เช่น "10:00") หรือพิมพ์ "จอง ${nextDate}"`
            : `⚠️ ช่วงวันที่เปิดให้จอง (${window.minISO} ถึง ${window.maxISO}) ไม่มีคิวว่างเลยครับ`) +
          `\n\n(หรือพิมพ์เปลี่ยนวันได้ครับ)`,
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
          limit: 24,
        });
      }
    }

    if (!candidates.length) {
      const progress = buildProgressCard({
        dateISO: plan.date!,
        timeRange: this.toDisplayTimeRange(plan.timeRange),
        categoryName: null,
        detailText: plan.detailText,
        serviceMode: plan.serviceMode,
        onlineChannelCode: plan.onlineChannelCode,
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
        serviceMode: plan.serviceMode,
        onlineChannelCode: plan.onlineChannelCode,
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
        serviceMode: plan.serviceMode,
        onlineChannelCode: plan.onlineChannelCode,
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
        serviceMode: plan.serviceMode,
        onlineChannelCode: plan.onlineChannelCode,
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
    // 🏢 Service Mode
    // --------------------------
    if (!plan.serviceMode) {
      const qCheck = question.toLowerCase();
      if (
        question === "คุยออนไลน์ (Online)" ||
        qCheck === "online" ||
        /ออนไลน์|on.?line|คุย.*ออนไลน์/.test(question)
      ) {
        plan.serviceMode = "ONLINE";
      } else if (
        question === "พบที่ศูนย์ (On-site)" ||
        qCheck === "onsite" ||
        /ออนไซ|on.?site|พบ.*ศูนย์|ไป.*ศูนย์|เจอตัว|พบตัว/.test(question)
      ) {
        plan.serviceMode = "ONSITE";
      } else if (safePlan.serviceMode === "ONLINE" || safePlan.serviceMode === "ONSITE") {
        // Fallback: let LLM decide if it understood
        plan.serviceMode = safePlan.serviceMode;
      }
    }

    if (!plan.serviceMode) {
      const progress = buildProgressCard({
        dateISO: plan.date!,
        timeRange: plan.timeRange!,
        categoryName: cat.problem_category_name_th,
        detailText: plan.detailText,
        serviceMode: plan.serviceMode,
        onlineChannelCode: plan.onlineChannelCode,
      });

      const q: AgentQuestion = {
        field: "serviceMode",
        text: "ต้องการเข้าพบแบบไหนครับ?",
        options: [
          { value: "ONSITE", label: "พบที่ศูนย์ (On-site)" },
          { value: "ONLINE", label: "คุยออนไลน์ (Online)" },
        ],
      };

      return {
        reply: replyNeedField({
          header: "🏢 **เลือกรูปแบบการเข้าพบครับ**",
          progress,
          ask: "ประเภทการเข้าพบ",
          examples: ["พบที่ศูนย์", "ออนไลน์"],
          candidates,
        }),
        state: plan,
        candidates,
        categories: mapCategoriesForUi(cats),
        channels: channels.map(c => ({ code: c.online_channel_code, name: c.online_channel_name_th || c.online_channel_code })),
        missingFields: ["serviceMode"],
        questions: [q],
      };
    }

    // --------------------------
    // 💻 Online Channel (If ONLINE)
    // --------------------------
    if (plan.serviceMode === "ONLINE" && !plan.onlineChannelCode) {
      const qUpper = question.toUpperCase();
      const match = channels.find((c) =>
        qUpper === c.online_channel_code.toUpperCase() ||
        qUpper === c.online_channel_name_th.toUpperCase() ||
        (c.online_channel_name_en && qUpper === c.online_channel_name_en.toUpperCase())
      );
      if (match) {
        plan.onlineChannelCode = match.online_channel_code;
      }
    }

    if (plan.serviceMode === "ONLINE" && !plan.onlineChannelCode) {
      const progress = buildProgressCard({
        dateISO: plan.date!,
        timeRange: plan.timeRange!,
        categoryName: cat.problem_category_name_th,
        detailText: plan.detailText,
        serviceMode: plan.serviceMode,
        onlineChannelCode: plan.onlineChannelCode,
      });

      const q: AgentQuestion = {
        field: "onlineChannelCode",
        text: "สะดวกใช้ช่องทางออนไลน์ไหนครับ?",
        options: channels.map(c => ({
          value: c.online_channel_code,
          label: c.online_channel_name_en || c.online_channel_name_th || c.online_channel_code
        })),
      };

      return {
        reply: replyNeedField({
          header: "💻 **เลือกช่องทางออนไลน์ครับ**",
          progress,
          ask: "ช่องทางออนไลน์",
          examples: channels.map(c => c.online_channel_name_en || c.online_channel_name_th || c.online_channel_code),
        }),
        state: plan,
        candidates,
        categories: mapCategoriesForUi(cats),
        channels: channels.map(c => ({ code: c.online_channel_code, name: c.online_channel_name_en || c.online_channel_name_th || c.online_channel_code })),
        missingFields: ["onlineChannelCode"],
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
      serviceMode: plan.serviceMode,
      onlineChannelCode: plan.onlineChannelCode,
    });

    const others = topCandidatesText(candidates);

    return {
      reply:
        `✅ **พร้อมยืนยันการจองแล้วครับ**\n\n` +
        progress +
        (others ? `\n\n**ช่วงว่างอื่น ๆ (ถ้าอยากเปลี่ยน)**\n${others}` : "") +
        `\n\nถ้าถูกต้อง กด **“ยืนยันการจอง”** ได้เลย`,
      state: plan,
      candidates,
      suggested,
      categories: mapCategoriesForUi(cats),
      channels: channels.map(c => ({ code: c.online_channel_code, name: c.online_channel_name_en || c.online_channel_name_th || c.online_channel_code })),
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
      serviceMode: plan.serviceMode,
      onlineChannelCode: plan.onlineChannelCode,
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
