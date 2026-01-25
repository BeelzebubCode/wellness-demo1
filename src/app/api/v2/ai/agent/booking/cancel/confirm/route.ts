// src/app/api/v2/ai/agent/booking/cancel/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { verifyToken } from "@/services/aiAgent/token";
import { agentCancelActiveForStudent } from "@/services/aiAgent/tools/booking";

export const runtime = "nodejs";

type CancelConfirmPayload = {
  v: number;
  exp: number; // ms epoch
  intent: "CANCEL";
  universityId: number;
  studentId: number;
  reason: string;
};

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json(
        { reply: "ไม่พบโปรไฟล์นักศึกษา" },
        { status: 200 },
      );
    }

    const body = await req.json().catch(() => ({}) as any);
    const confirmToken = String(body?.confirmToken || "").trim();
    if (!confirmToken)
      return NextResponse.json(
        { reply: "ไม่พบ confirmToken" },
        { status: 200 },
      );

    const payload = verifyToken<CancelConfirmPayload>(confirmToken);
    if (!payload)
      return NextResponse.json(
        { reply: "confirmToken ไม่ถูกต้อง" },
        { status: 200 },
      );

    if (!payload.exp || Date.now() > Number(payload.exp)) {
      return NextResponse.json(
        { reply: "ลิงก์ยืนยันหมดอายุแล้ว ลองใหม่ครับ 🙂" },
        { status: 200 },
      );
    }

    if (payload.intent !== "CANCEL") {
      return NextResponse.json(
        { reply: "confirmToken ไม่ใช่สำหรับการยกเลิก" },
        { status: 200 },
      );
    }

    // ✅ กันข้ามมหาลัย/ข้ามคน
    if (Number(payload.universityId) !== Number(activeUniversityId)) {
      return NextResponse.json({ reply: "มหาลัยไม่ตรงกัน" }, { status: 200 });
    }
    if (Number(payload.studentId) !== Number(account.studentId)) {
      return NextResponse.json(
        { reply: "บัญชีไม่ตรงกับผู้ยืนยัน" },
        { status: 200 },
      );
    }

    const reason = String(payload.reason || "").trim();
    if (!reason) {
      return NextResponse.json(
        { reply: "ขอเหตุผลในการยกเลิกนัดหมายด้วยครับ 🙂" },
        { status: 200 },
      );
    }

    const result = await agentCancelActiveForStudent({
      activeUniversityId,
      studentId: account.studentId,
      reason,
    });

    return NextResponse.json(
      {
        success: true,
        bookingId: result.bookingId,
        reply: `✅ ยกเลิกนัดหมายสำเร็จ (#${result.bookingId})`,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error(err);
    const message =
      typeof err?.message === "string" ? err.message : "ยกเลิกไม่สำเร็จ";
    return NextResponse.json(
      { success: false, reply: `ยกเลิกไม่สำเร็จ: ${message}`, error: message },
      { status: 200 },
    );
  }
}
