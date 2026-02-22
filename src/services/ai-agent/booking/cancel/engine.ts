// src/services/aiAgent/booking/cancel/engine.ts
import type { ChatMsg, AgentQuestion } from "@/services/ai-agent/core";
import { signConfirmToken } from "@/services/ai-agent/core";

import type { BookingCancelResponse, CancelDraft } from "./types";
import { extractCancelReason } from "./domain/reason";
import { msgNeedReason, msgConfirmCancel } from "./presenter/messages";
import { loadCancellationReasons } from "./adapters/cancellationReasonsRepo";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

type Deps = {
  minReasonLen?: number;
};

export class BookingCancelEngine {
  constructor(private deps: Deps) { }

  async run(input: {
    activeUniversityId: number;
    studentId: number;
    body: any;
  }): Promise<BookingCancelResponse> {
    const { activeUniversityId, studentId, body } = input;

    // ✅ Gate: ต้องมีนัดที่ active ถึงจะยกเลิกได้
    const activeBooking = await prisma.booking.findFirst({
      where: {
        university_id: activeUniversityId,
        student_id: studentId,
        booking_status: {
          in: [
            BookingStatus.PENDING_ASSIGNMENT,
            BookingStatus.ASSIGNED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      },
      select: {
        booking_id: true,
        timeSlot: {
          select: {
            time_slot_start_datetime: true,
          },
        },
      },
      orderBy: { booking_created_at: "desc" },
    });

    if (!activeBooking) {
      return {
        reply:
          "❌ **ไม่พบนัดหมายที่รอให้ยกเลิก**\n\n" +
          "คุณยังไม่มีนัดหมายที่อยู่ในสถานะรอดำเนินการ " +
          "หากต้องการจองนัดใหม่ พิมพ์วันและเวลาที่ต้องการได้เลยครับ 🙂",
        cancelReasons: [],
      };
    }

    // Show booking info so user knows which booking will be cancelled
    const slotDate = activeBooking.timeSlot?.time_slot_start_datetime
      ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(activeBooking.timeSlot.time_slot_start_datetime)
      : null;

    const userMessages = this.collectMessages(body);
    const question = this.lastUserText(userMessages).trim();

    // ✅ Load cancellation reasons from DB (shown as option pills)
    const cancelReasons = await loadCancellationReasons();
    const reasonOptions = cancelReasons.map((r) => ({
      value: r.name,
      label: r.name,
      code: r.code,
    }));

    if (!question) {
      return {
        reply:
          `🗓️ **พบนัดหมายที่สามารถยกเลิกได้**${slotDate ? ` (${slotDate})` : ""}\n\n` +
          `โปรดเลือกเหตุผลการยกเลิกจากตัวเลือกด้านล่าง หรือพิมพ์เหตุผลสั้น ๆได้เลยครับ`,
        cancelReasons,
      };
    }

    // ✅ Check if user selected one of the DB reasons (exact or partial match)
    const matchedReason = cancelReasons.find(
      (r) => question === r.name || question.includes(r.name) || r.name.includes(question)
    );

    const reason = matchedReason?.name ?? extractCancelReason(question)?.trim() ?? null;
    const minLen = this.deps.minReasonLen ?? 3;

    const state: CancelDraft = { intent: "CANCEL", reason: reason || null };

    if (!state.reason || state.reason.length < minLen) {
      const q: AgentQuestion = {
        field: "reason",
        text: "ต้องการยกเลิกเพราะอะไรครับ? (สั้น ๆ ก็ได้)",
        options: reasonOptions,
      };

      return {
        reply:
          `🗓️ **พบนัดหมาย${slotDate ? ` วันที่ ${slotDate}` : ""}**\n\n` +
          msgNeedReason(),
        state,
        missingFields: ["reason"],
        questions: [q],
        cancelReasons,
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
      cancelReasons,
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
