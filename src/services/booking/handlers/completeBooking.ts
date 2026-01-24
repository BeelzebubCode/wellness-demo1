// src/services/booking/handlers/completeBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

type CompleteBody = {
  consultantNote?: string;
  nextStep?: string | null;
  riskLevel?: any; // ถ้าใน prisma เป็น enum ก็เปลี่ยน type ให้ตรงได้
};

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

  const consultantNote = (body?.consultantNote || "").trim();
  if (!consultantNote) {
    return NextResponse.json({ error: "กรุณาระบุบันทึกการปรึกษา" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    select: {
      booking_id: true,
      university_id: true,
      consultant_id: true,
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

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { booking_id: bookingId },
      data: { booking_status: BookingStatus.COMPLETED },
    });

    await tx.bookingOutcome.upsert({
      where: { booking_id: bookingId },
      update: {
        booking_outcome_consultant_note: consultantNote,
        booking_outcome_next_step: body?.nextStep ?? null,
        booking_outcome_risk_level: body?.riskLevel,
      },
      create: {
        booking_id: bookingId,
        booking_outcome_consultant_note: consultantNote,
        booking_outcome_next_step: body?.nextStep ?? null,
        booking_outcome_risk_level: body?.riskLevel,
      },
    });
  });

  return NextResponse.json({ success: true, status: BookingStatus.COMPLETED });
}
