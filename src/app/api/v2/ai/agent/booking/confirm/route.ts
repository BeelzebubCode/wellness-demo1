// src/app/api/v2/ai/agent/booking/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { confirmAgentAction } from "@/services/aiAgent/bookingPlan/confirm"; // ตอนนี้ใช้ของเดิมไปก่อน

export const runtime = "nodejs";

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

    const body = await req.json().catch(() => ({} as any));
    const confirmToken = String(body?.confirmToken || "").trim();

    // ✅ เพิ่ม
    if (!confirmToken) {
      return NextResponse.json(
        { success: false, reply: "ไม่พบ confirmToken" },
        { status: 200 },
      );
    }

    const result = await confirmAgentAction({
      confirmToken,
      activeUniversityId,
      accountStudentId: account.studentId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json(
      { success: false, reply: `ไม่สำเร็จ: ${message}`, error: message },
      { status: 200 },
    );
  }
}
