// src/services/booking/handlers/startBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

export async function handleStartBooking(ctx: AccountContext, bookingIdRaw: string) {
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

  await prisma.booking.update({
    where: { booking_id: bookingId },
    data: { booking_status: BookingStatus.IN_PROGRESS },
  });

  return NextResponse.json({ success: true, status: BookingStatus.IN_PROGRESS });
}
