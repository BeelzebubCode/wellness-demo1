// src/app/api/v2/ai/agent/booking/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { runBookingPlan } from "@/services/aiAgent/bookingPlan/plan";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);
    if (!account.studentId) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const result = await runBookingPlan({
      activeUniversityId,
      studentId: account.studentId,
      body,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { reply: "ระบบมีปัญหาเล็กน้อย ลองใหม่อีกครั้งนะครับ", detail: String(err?.message ?? err).slice(0, 200) },
      { status: 200 },
    );
  }
}
