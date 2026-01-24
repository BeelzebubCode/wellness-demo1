// src/services/booking/handlers/assignBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

type AssignBody = { consultantId?: number; note?: string };

export async function handleAssignBooking(
  ctx: AccountContext,
  bookingIdRaw: string,
  body: AssignBody
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const role = ctx.role as AccountRole;
  if (role !== "HEAD_CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const assignedById = ctx.consultantId;
  if (typeof assignedById !== "number") {
    return NextResponse.json({ error: "Missing head consultant id" }, { status: 400 });
  }

  const consultantId = body?.consultantId;
  if (typeof consultantId !== "number") {
    return NextResponse.json({ error: "กรุณาระบุผู้ให้คำปรึกษา" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    select: { booking_id: true, university_id: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  // tenant guard
  const deniedUni = requireUniversity(ctx, booking.university_id);
  if (deniedUni) return deniedUni;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { booking_id: bookingId },
      data: { booking_status: BookingStatus.ASSIGNED, consultant_id: consultantId },
    });

    await tx.bookingAssignment.create({
      data: {
        booking_id: bookingId,
        booking_assignment_assigned_by_id: assignedById,
        booking_assignment_assigned_to_id: consultantId,
        booking_assignment_note: body?.note ?? null,
      },
    });
  });

  return NextResponse.json({ success: true, status: BookingStatus.ASSIGNED });
}
