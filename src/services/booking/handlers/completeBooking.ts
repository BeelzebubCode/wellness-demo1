// src/services/booking/handlers/completeBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

type CompleteBody = {
  consultantNote?: string;
  nextStep?: string | null;
  riskLevel?: any; // จะ parse เป็น number ให้
};

function normalizeNextStep(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function normalizeRiskLevel(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

export async function handleCompleteBooking(
  ctx: AccountContext,
  bookingIdRaw: string,
  body: CompleteBody
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const role = ctx.role as AccountRole;
  if (role !== "CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  if (typeof ctx.consultantId !== "number") {
    return NextResponse.json({ error: "Missing consultant id" }, { status: 400 });
  }

  const consultantNote = String(body?.consultantNote ?? "").trim();
  if (!consultantNote) {
    return NextResponse.json({ error: "กรุณาระบุบันทึกการปรึกษา" }, { status: 400 });
  }

  const nextStep = normalizeNextStep(body?.nextStep);
  const riskLevel = normalizeRiskLevel(body?.riskLevel);

  // ✅ validate risk 1-5 (หรือ null)
  if (riskLevel !== null && (riskLevel < 1 || riskLevel > 5)) {
    return NextResponse.json({ error: "Risk level ต้องอยู่ในช่วง 1-5" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    select: {
      booking_id: true,
      university_id: true,
      consultant_id: true,
      booking_status: true, // ✅ เพิ่ม status มาเช็ค
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  // tenant guard
  const deniedUni = requireUniversity(ctx, booking.university_id);
  if (deniedUni) return deniedUni;

  // must be assigned to this consultant
  if (booking.consultant_id !== ctx.consultantId) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // ✅ optional: บังคับ flow ต้อง IN_PROGRESS ก่อนถึงจะส่งงานได้
  if (booking.booking_status !== BookingStatus.IN_PROGRESS) {
    return NextResponse.json(
      { error: `สถานะต้องเป็น IN_PROGRESS ก่อนส่งงาน (ตอนนี้: ${booking.booking_status})` },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    // แนะนำ: เซฟ outcome ก่อน แล้วค่อย complete (กันเคสข้อมูล outcome หาย)
    await tx.bookingOutcome.upsert({
      where: { booking_id: bookingId },
      update: {
        booking_outcome_consultant_note: consultantNote,
        booking_outcome_next_step: nextStep,
        booking_outcome_risk_level: riskLevel,
        booking_outcome_recorded_at: new Date(), // ✅ เพิ่ม
      },
      create: {
        booking_id: bookingId,
        booking_outcome_consultant_note: consultantNote,
        booking_outcome_next_step: nextStep,
        booking_outcome_risk_level: riskLevel,
        booking_outcome_recorded_at: new Date(), // ✅ เพิ่ม
      },
    });

    await tx.booking.update({
      where: { booking_id: bookingId },
      data: { booking_status: BookingStatus.COMPLETED },
    });
  });

  return NextResponse.json({ success: true, status: BookingStatus.COMPLETED });
}
