// src/services/aiAgent/bookingConfirm/confirm.ts
import { verifyToken } from "@/services/aiAgent/token";
import {
  agentBookForStudent,
  agentCancelActiveForStudent,
} from "@/services/aiAgent/tools/booking";

export type ConfirmPayloadBook = {
  v: number;
  exp: number;
  action?: "BOOK"; // ✅ allow legacy token ที่ไม่มี action
  universityId: number;
  studentId: number;
  timeSlotId: number;
  problemCategoryId: number;
  detailText: string | null;
};

export type ConfirmPayloadCancel = {
  v: number;
  exp: number;
  action?: "CANCEL"; // ✅ allow legacy token ที่ไม่มี action
  universityId: number;
  studentId: number;
  reason: string | null;
};

export type ConfirmPayload = ConfirmPayloadBook | ConfirmPayloadCancel;

export type ConfirmResult =
  | {
      success: true;
      action: "BOOK" | "CANCEL";
      bookingId: number;
      reply: string;
    }
  | {
      success: false;
      reply: string;
      error?: string;
    };

function inferAction(payload: any): "BOOK" | "CANCEL" | null {
  // ✅ token เก่าไม่มี action: ถ้ามี timeSlotId + problemCategoryId => BOOK
  if (payload && payload.timeSlotId && payload.problemCategoryId) return "BOOK";
  if (payload && (payload.reason !== undefined || payload.action === "CANCEL"))
    return "CANCEL";
  return null;
}

function friendlyError(errMsg: string) {
  const m = (errMsg || "").trim();

  // ปรับคำตอบให้คุยกับ user ดีขึ้น
  if (m.includes("มีการจองที่ยังไม่เสร็จสิ้นอยู่แล้ว"))
    return "ตอนนี้คุณมีนัดหมายที่กำลังดำเนินการอยู่แล้วครับ ถ้าต้องการเปลี่ยนเวลา ให้ยกเลิกนัดเดิมก่อน 🙂";

  if (m.includes("ช่วงเวลานี้เต็มแล้ว"))
    return "ช่วงเวลานี้เต็มแล้วครับ ลองเลือกช่วงเวลาอื่นได้เลย 🙂";

  if (m.includes("ไม่พบช่วงเวลานี้ในระบบ"))
    return "ไม่พบช่วงเวลานี้ในระบบครับ ลองเลือกใหม่อีกครั้ง 🙂";

  if (m.includes("ไม่พบนัดหมายที่กำลังดำเนินการอยู่"))
    return "ตอนนี้ยังไม่มีนัดหมายที่กำลังดำเนินการให้ยกเลิกครับ 🙂";

  return `ไม่สำเร็จ: ${m || "เกิดข้อผิดพลาด"}`;
}

export async function confirmAgentAction(input: {
  confirmToken: string;
  activeUniversityId: number;
  accountStudentId: number;
}): Promise<ConfirmResult> {
  const confirmToken = String(input.confirmToken || "").trim();
  if (!confirmToken) return { success: false, reply: "ไม่พบ confirmToken" };

  const payload = verifyToken<ConfirmPayload>(confirmToken);
  if (!payload) return { success: false, reply: "confirmToken ไม่ถูกต้อง" };

  if (!payload.exp || Date.now() > Number(payload.exp)) {
    return { success: false, reply: "confirmToken หมดอายุแล้ว ลองใหม่ครับ" };
  }

  if (Number(payload.universityId) !== Number(input.activeUniversityId)) {
    return { success: false, reply: "มหาลัยไม่ตรงกัน" };
  }

  if (Number(payload.studentId) !== Number(input.accountStudentId)) {
    return { success: false, reply: "บัญชีไม่ตรงกับผู้ยืนยัน" };
  }

  // ✅ FIX: handle legacy tokens without action
  const action =
    payload.action === "BOOK" || payload.action === "CANCEL"
      ? payload.action
      : inferAction(payload);

  if (!action) {
    return { success: false, reply: "confirmToken ไม่มี action ที่รองรับ" };
  }

  try {
    if (action === "BOOK") {
      const p = payload as ConfirmPayloadBook;

      const r = await agentBookForStudent({
        activeUniversityId: input.activeUniversityId,
        studentId: input.accountStudentId,
        timeSlotId: Number(p.timeSlotId),
        problemCategoryId: Number(p.problemCategoryId),
        detailText: p.detailText || null,
      });

      return {
        success: true,
        action: "BOOK",
        bookingId: r.bookingId,
        reply: `✅ ยืนยันการจองสำเร็จ (#${r.bookingId})`,
      };
    }

    // CANCEL
    const p = payload as ConfirmPayloadCancel;
    const reason = p.reason?.trim() || "ยกเลิกโดยผู้ใช้";

    const r = await agentCancelActiveForStudent({
      activeUniversityId: input.activeUniversityId,
      studentId: input.accountStudentId,
      reason,
    });

    return {
      success: true,
      action: "CANCEL",
      bookingId: r.bookingId,
      reply: `✅ ยกเลิกนัดหมายสำเร็จ (#${r.bookingId})`,
    };
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "เกิดข้อผิดพลาด";
    return { success: false, reply: friendlyError(msg), error: msg };
  }
}
