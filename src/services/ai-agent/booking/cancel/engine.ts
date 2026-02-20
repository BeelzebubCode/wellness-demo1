// src/services/aiAgent/booking/cancel/engine.ts
import type { ChatMsg, AgentQuestion } from "@/services/ai-agent/core";
import { signConfirmToken } from "@/services/ai-agent/core";

import type { BookingCancelResponse, CancelDraft } from "./types";
import { extractCancelReason } from "./domain/reason";
import { msgNeedReason, msgConfirmCancel } from "./presenter/messages";

type Deps = {
  // เผื่ออนาคต: allowEmptyReason, minLenReason, etc.
  minReasonLen?: number;
};

export class BookingCancelEngine {
  constructor(private deps: Deps) {}

  async run(input: {
    activeUniversityId: number;
    studentId: number;
    body: any;
  }): Promise<BookingCancelResponse> {
    const { activeUniversityId, studentId, body } = input;

    const userMessages = this.collectMessages(body);
    const question = this.lastUserText(userMessages).trim();

    if (!question) {
      return { reply: "พิมพ์ว่าต้องการยกเลิกนัดหมาย พร้อมเหตุผลสั้น ๆ ได้เลยครับ 🙂" };
    }

    const reason = extractCancelReason(question);
    const minLen = this.deps.minReasonLen ?? 3;

    const state: CancelDraft = { intent: "CANCEL", reason: reason?.trim() || null };

    if (!state.reason || state.reason.length < minLen) {
      const q: AgentQuestion = {
        field: "reason",
        text: "ต้องการยกเลิกเพราะอะไรครับ? (สั้น ๆ ก็ได้)",
      };

      return {
        reply: msgNeedReason(),
        state,
        missingFields: ["reason"],
        questions: [q],
      };
    }

    // ✅ confirm token (action=CANCEL)
    const payload = {
      v: 1,
      exp: Date.now() + 5 * 60 * 1000,
      action: "CANCEL",
      universityId: activeUniversityId,
      studentId,
      reason: state.reason,
    };

    const confirmToken = signConfirmToken(payload);

    return {
      reply: msgConfirmCancel(state.reason),
      state,
      confirmToken,
      missingFields: [],
      questions: [],
    };
  }

  // -------------------- helpers --------------------

  private collectMessages(body: any): ChatMsg[] {
    const { messages, message } = body ?? {};
    if (Array.isArray(messages)) {
      return messages
        .filter((m: any) => m && typeof m.role === "string" && typeof m.content === "string")
        .filter((m: any) => m.role === "user" || m.role === "assistant" || m.role === "system")
        .filter((m: any) => m.role !== "system")
        .map((m: any) => ({ role: m.role, content: m.content }));
    }

    if (typeof message === "string" && message.trim()) {
      return [{ role: "user", content: message.trim() }];
    }

    return [];
  }

  private lastUserText(msgs: ChatMsg[]) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i]?.role === "user") return msgs[i].content || "";
    }
    return "";
  }
}
