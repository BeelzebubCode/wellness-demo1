// src/app/api/v2/ai/agent/booking/cancel/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { runBookingCancelConfirm } from "@/services/aiAgent/bookingCancel/confirm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json({ success: false, reply: "ไม่พบโปรไฟล์นักศึกษา" }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}) as any);
    const confirmToken = String(body?.confirmToken || "").trim();

    const r = await runBookingCancelConfirm({
      activeUniversityId,
      studentId: account.studentId,
      confirmToken,
    });

    return NextResponse.json(r, { status: 200 });
  } catch (err: any) {
    console.error(err);
    const message = typeof err?.message === "string" ? err.message : "ยกเลิกไม่สำเร็จ";
    return NextResponse.json(
      { success: false, reply: `ยกเลิกไม่สำเร็จ: ${message}`, error: message },
      { status: 200 },
    );
  }
}
