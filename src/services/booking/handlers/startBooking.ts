// src/services/booking/handlers/startBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

export async function handleStartBooking(
  ctx: AccountContext & { activeUniversityId?: number },
  bookingIdRaw: string,
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  const deniedUni = requireUniversity(ctx as any, activeUniversityId);
  if (deniedUni) return deniedUni;

  const role = ctx.role as AccountRole;
  if (role !== "CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const consultantId = (ctx as any).consultantId as number | undefined;
  if (typeof consultantId !== "number") {
    return NextResponse.json({ error: "Missing consultant id" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: {
      university_id_booking_id: {
        university_id: activeUniversityId,
        booking_id: bookingId,
      },
    },
    select: {
      booking_id: true,
      university_id: true,
      consultant_id: true,
      booking_status: true,

      // ✅ เพิ่ม
      booking_service_mode: true,
      booking_online_channel_url: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  if (booking.consultant_id !== consultantId) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  if (booking.booking_status !== BookingStatus.ASSIGNED) {
    return NextResponse.json(
      { error: `สถานะต้องเป็น ASSIGNED ก่อนเริ่มงาน (ตอนนี้: ${booking.booking_status})` },
      { status: 409 },
    );
  }

  const upd = await prisma.booking.updateMany({
    where: {
      university_id: activeUniversityId,
      booking_id: bookingId,
      consultant_id: consultantId,
      booking_status: BookingStatus.ASSIGNED,
    },
    data: { booking_status: BookingStatus.IN_PROGRESS },
  });

  if (upd.count === 0) {
    return NextResponse.json(
      { error: "เริ่มงานไม่สำเร็จ (อาจถูกเปลี่ยนสถานะไปแล้ว)" },
      { status: 409 },
    );
  }

  // ✅ ตัดสินใจว่า “ต้องขอ online channel ไหม”
  const mode = String(booking.booking_service_mode ?? "").toUpperCase();
  const requireOnlineChannel = mode === "ONLINE" && !String(booking.booking_online_channel_url ?? "").trim();

  return NextResponse.json({
    success: true,
    status: BookingStatus.IN_PROGRESS,
    requireOnlineChannel,
  });
}
