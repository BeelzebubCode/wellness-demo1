// src/services/booking/handlers/startBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

function upper(v: any) {
  return String(v ?? "").toUpperCase();
}

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

  // tenant guard
  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  const role = ctx.role as AccountRole;

  // ✅ รับเคสควรเป็น CONSULTANT เท่านั้น (ชัด ๆ)
  if (role !== "CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const consultantId = (ctx as any).consultantId as number | undefined;
  if (typeof consultantId !== "number") {
    return NextResponse.json({ error: "Missing consultant id" }, { status: 400 });
  }

  // ✅ หา booking ใน tenant นี้
  const booking = await prisma.booking.findUnique({
    where: {
      university_id_booking_id: {
        university_id: activeUniversityId,
        booking_id: bookingId,
      },
    },
    select: {
      booking_id: true,
      consultant_id: true,
      booking_status: true,
      booking_service_mode: true,
      booking_online_channel: true,
      // ถ้าคุณมี field แยก url/note ก็ select เพิ่มได้
      // booking_online_channel_url: true,
      // booking_online_channel_note: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  // ✅ ต้องเป็นงานของ consultant คนนี้เท่านั้น
  if (booking.consultant_id !== consultantId) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // ✅ บังคับ flow
  if (booking.booking_status !== BookingStatus.ASSIGNED) {
    return NextResponse.json(
      { error: `สถานะต้องเป็น ASSIGNED ก่อนรับเคส (ตอนนี้: ${booking.booking_status})` },
      { status: 409 },
    );
  }

  // ✅ update สถานะ (กัน race)
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
      { error: "สถานะไม่อนุญาตให้รับเคส หรือรายการถูกเปลี่ยนไปแล้ว" },
      { status: 409 },
    );
  }

  // ✅ ถ้าเป็น ONLINE และยังไม่มีช่องทาง -> ให้ FE เปิด modal กรอกลิงก์
  const isOnline = upper(booking.booking_service_mode) === "ONLINE";
  const hasChannel = !!String(booking.booking_online_channel ?? "").trim();

  return NextResponse.json({
    success: true,
    status: BookingStatus.IN_PROGRESS,
    requireOnlineChannel: isOnline && !hasChannel,
    serviceMode: booking.booking_service_mode ?? null,
    onlineChannelUrl: booking.booking_online_channel ?? null,
    onlineChannelNote: null,
  });
}
