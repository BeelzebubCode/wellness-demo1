// src/app/api/v2/ai/agent/booking/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";

// ✅ เปลี่ยนมาใช้ของใหม่
import { runBookingPlan } from "@/services/ai-agent/booking/plan";

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

    // ✅ Check for existing active booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        university_id: activeUniversityId!,
        student_id: account.studentId,
        booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] },
      },
      include: {
        timeSlot: true,
      },
    });

    if (activeBooking) {
      const date = new Date(activeBooking.timeSlot.time_slot_start_datetime).toLocaleDateString("th-TH");
      const time = new Date(activeBooking.timeSlot.time_slot_start_datetime).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });
      return NextResponse.json({
        reply: `คุณมีรายการจองค้างอยู่แล้วครับ (วันที่ ${date} เวลา ${time})\nต้องยกเลิกคิวเดิมก่อน หรือรอให้เสร็จสิ้นจึงจะจองใหม่ได้`,
        state: { activeBooking }, // Send details for UI to potentially use
        suggested: ["ยกเลิกคิวเดิม", "ตรวจสอบสถานะ"],
      }, { status: 200 });
    }

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
