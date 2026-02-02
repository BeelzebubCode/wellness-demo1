// src/app/api/v2/ai/agent/booking/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";

// ✅ เปลี่ยนมาใช้ของใหม่
import { runBookingPlan } from "@/services/aiAgent/booking/plan";

export const runtime = "nodejs";

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

    const body = await req.json().catch(() => ({} as any));

    const result = await runBookingPlan({
      activeUniversityId,
      studentId: account.studentId,
      body,
    });

    // ✅ always 200 เพื่อให้ FE ไม่ต้องแยก error status
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error(err);
    const message = typeof err?.message === "string" ? err.message : "ระบบมีปัญหา";
    return NextResponse.json(
      { reply: "ระบบมีปัญหาเล็กน้อย ลองใหม่อีกครั้งนะครับ", error: message },
      { status: 200 },
    );
  }
}
