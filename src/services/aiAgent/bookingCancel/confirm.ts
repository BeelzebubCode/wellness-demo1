// src/services/aiAgent/bookingCancel/confirm.ts
import { verifyToken } from "@/services/aiAgent/token";
import { agentCancelActiveForStudent } from "@/services/aiAgent/tools/booking";

export type CancelConfirmPayload = {
  v: number;
  exp: number; // ms epoch
  action: "CANCEL";
  universityId: number;
  studentId: number;
  reason: string;
};

export type CancelConfirmResponse =
  | { success: true; action: "CANCEL"; bookingId: number; reply: string }
  | { success: false; action?: "CANCEL"; reply: string; error?: string };

export async function runBookingCancelConfirm(input: {
  activeUniversityId: number;
  studentId: number;
  confirmToken: string;
}): Promise<CancelConfirmResponse> {
  const { activeUniversityId, studentId, confirmToken } = input;

  const token = String(confirmToken || "").trim();
  if (!token) return { success: false, reply: "ไม่พบ confirmToken" };

  const payload = verifyToken<CancelConfirmPayload>(token);
  if (!payload) return { success: false, reply: "confirmToken ไม่ถูกต้อง" };

  if (!payload.exp || Date.now() > Number(payload.exp)) {
    return { success: false, reply: "ลิงก์ยืนยันหมดอายุแล้ว ลองใหม่ครับ 🙂" };
  }

  // ✅ ต้องเป็น CANCEL เท่านั้น
  if (payload.action !== "CANCEL") {
    return { success: false, reply: "confirmToken ไม่ใช่สำหรับการยกเลิก" };
  }

  // ✅ กันข้ามมหาลัย/ข้ามคน
  if (Number(payload.universityId) !== Number(activeUniversityId)) {
    return { success: false, reply: "มหาลัยไม่ตรงกัน" };
  }
  if (Number(payload.studentId) !== Number(studentId)) {
    return { success: false, reply: "บัญชีไม่ตรงกับผู้ยืนยัน" };
  }

  const reason = String(payload.reason || "").trim();
  if (!reason) {
    return { success: false, reply: "ขอเหตุผลในการยกเลิกนัดหมายด้วยครับ 🙂" };
  }

  const result = await agentCancelActiveForStudent({
    activeUniversityId,
    studentId,
    reason,
  });

  return {
    success: true,
    action: "CANCEL",
    bookingId: result.bookingId,
    reply: `✅ ยกเลิกนัดหมายสำเร็จ (#${result.bookingId})`,
  };
}
