// src/services/aiAgent/core/confirm/action.ts

import { verifyConfirmToken } from "./token";

import { confirmBookingPlan } from "../../booking/plan/confirm";
import { confirmBookingCancel } from "../../booking/cancel/confirm";

export async function confirmAgentAction(args: {
  confirmToken: string;
  activeUniversityId: number;
  accountStudentId: number;
  accountId: number;
  serviceMode?: string;
  onlineChannelCode?: string | null;
  consentChecked?: boolean;
  agreementSignatureDataUrl?: string | null;
}) {
  const { confirmToken, activeUniversityId, accountStudentId, accountId } = args;

  const payload = verifyConfirmToken(confirmToken);

  if (payload?.studentId && payload.studentId !== accountStudentId) {
    return { success: false, reply: "ยืนยันไม่สำเร็จ: token ไม่ตรงกับผู้ใช้" };
  }

  const action = String(payload?.action || payload?.kind || payload?.intent || "").toUpperCase();

  if (action === "CANCEL") {
    return await confirmBookingCancel({
      activeUniversityId,
      studentId: accountStudentId,
      cancelledByAccountId: accountId,
      payload,
    });
  }

  return await confirmBookingPlan({
    activeUniversityId,
    studentId: accountStudentId,
    payload: {
      ...payload,
      serviceMode: args.serviceMode,
      onlineChannelCode: args.onlineChannelCode,
      consentChecked: args.consentChecked,
      agreementSignatureDataUrl: args.agreementSignatureDataUrl,
    },
  });
}
