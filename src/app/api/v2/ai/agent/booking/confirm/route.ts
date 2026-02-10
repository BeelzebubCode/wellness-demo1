// src/app/api/v2/ai/agent/booking/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";
import { confirmAgentAction } from "@/services/aiAgent/core/confirm/action";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json({ success: false, reply: "ไม่พบโปรไฟล์นักศึกษา" }, { status: 200 });
    }

    const body = await req.json().catch(() => ({} as any));
    const confirmToken = String(body?.confirmToken || "").trim();
    if (!confirmToken) {
      return NextResponse.json({ success: false, reply: "ไม่พบ confirmToken" }, { status: 200 });
    }

    // ✅ Double check before confirming
    const existing = await prisma.booking.findFirst({
      where: {
        university_id: activeUniversityId!,
        student_id: account.studentId,
        booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        reply: "คุณมีรายการจองค้างอยู่แล้ว ไม่สามารถจองซ้ำได้ครับ",
      }, { status: 200 });
    }

    const result = await confirmAgentAction({
      confirmToken,
      activeUniversityId,
      accountStudentId: account.studentId,
      accountId: account.accountId, // ✅ เพิ่ม
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
