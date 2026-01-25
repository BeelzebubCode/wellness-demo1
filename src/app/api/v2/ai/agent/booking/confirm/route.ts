// src/app/api/v2/ai/agent/booking/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { verifyToken } from "@/services/aiAgent/token";
import {
  agentBookForStudent,
  agentCancelActiveForStudent,
} from "@/services/aiAgent/tools/booking";

export const runtime = "nodejs";

type ConfirmPayload =
  | {
      v: number;
      exp: number;
      action: "BOOK";
      universityId: number;
      studentId: number;
      timeSlotId: number;
      problemCategoryId: number;
      detailText: string | null;
    }
  | {
      v: number;
      exp: number;
      action: "CANCEL";
      universityId: number;
      studentId: number;
      reason: string | null;
    };

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json(
        { success: false, reply: "ไม่พบโปรไฟล์นักศึกษา" },
        { status: 200 },
      );
    }

    const body = await req.json().catch(() => ({}) as any);
    const confirmToken = String(body?.confirmToken || "").trim();
    if (!confirmToken) {
      return NextResponse.json(
        { success: false, reply: "ไม่พบ confirmToken" },
        { status: 200 },
      );
    }

    const payload = verifyToken<ConfirmPayload>(confirmToken);
    if (!payload)
      return NextResponse.json(
        { success: false, reply: "confirmToken ไม่ถูกต้อง" },
        { status: 200 },
      );

    if (!payload.exp || Date.now() > Number(payload.exp)) {
      return NextResponse.json(
        { success: false, reply: "confirmToken หมดอายุแล้ว ลองใหม่ครับ" },
        { status: 200 },
      );
    }

    if (Number(payload.universityId) !== Number(activeUniversityId)) {
      return NextResponse.json(
        { success: false, reply: "มหาลัยไม่ตรงกัน" },
        { status: 200 },
      );
    }
    if (Number(payload.studentId) !== Number(account.studentId)) {
      return NextResponse.json(
        { success: false, reply: "บัญชีไม่ตรงกับผู้ยืนยัน" },
        { status: 200 },
      );
    }

    if (payload.action === "BOOK") {
      const r = await agentBookForStudent({
        activeUniversityId,
        studentId: account.studentId,
        timeSlotId: Number(payload.timeSlotId),
        problemCategoryId: Number(payload.problemCategoryId),
        detailText: payload.detailText || null,
      });

      return NextResponse.json(
        {
          success: true,
          action: "BOOK",
          bookingId: r.bookingId,
          reply: `✅ ยืนยันการจองสำเร็จ (#${r.bookingId})`,
        },
        { status: 200 },
      );
    }

    // CANCEL
    const reason = payload.reason?.trim() || "ยกเลิกโดยผู้ใช้";
    const r = await agentCancelActiveForStudent({
      activeUniversityId,
      studentId: account.studentId,
      reason,
    });

    return NextResponse.json(
      {
        success: true,
        action: "CANCEL",
        bookingId: r.bookingId,
        reply: `✅ ยกเลิกนัดหมายสำเร็จ (#${r.bookingId})`,
      },
      { status: 200 },
    );
  } catch (err: any) {
    const message =
      typeof err?.message === "string" ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json(
      { success: false, reply: `ไม่สำเร็จ: ${message}`, error: message },
      { status: 200 },
    );
  }
}
