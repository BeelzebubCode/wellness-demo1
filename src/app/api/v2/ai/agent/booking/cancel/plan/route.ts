// src/app/api/v2/ai/agent/booking/cancel/plan/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";

// ✅ ของใหม่
import { runBookingCancel } from "@/services/aiAgent/booking/cancel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json({ reply: "ไม่พบโปรไฟล์นักศึกษา" }, { status: 200 });
    }

    const body = await req.json().catch(() => ({} as any));

    const r = await runBookingCancel({
      activeUniversityId,
      studentId: account.studentId,
      body,
    });

    return NextResponse.json(r, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { reply: "ระบบมีปัญหาเล็กน้อย ลองใหม่อีกครั้งนะครับ" },
      { status: 200 },
    );
  }
}
