// src/services/booking/handlers/startBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus } from "@prisma/client";

function upper(v: unknown) {
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

  const activeUniversityId = ctx.activeUniversityId;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  // tenant guard
  const denied = requireUniversity(ctx, activeUniversityId);
  if (denied) return denied;

  const role = ctx.role as string;

  // ✅ รับเคสควรเป็น CONSULTANT เท่านั้น (ชัด ๆ)
  if (role !== "CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const consultantId = ctx.consultantId;
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
      service_mode_id: true,
      serviceMode: { select: { code: true } },
      onlineChannel: {
        select: { online_channel_code: true }
      },
      // ถ้าคุณมี field แยก url/note ก็ select เพิ่มได้
      // booking_online_channel_url: true,
      // booking_online_channel_note: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  // ✅ ต้องเป็นงานของ consultant คนนี้เท่านั้น (เช็คทั้ง field ตรง หรือมี assignment)
  let isAuthorized = booking.consultant_id === consultantId;
  if (!isAuthorized) {
    const assignment = await prisma.bookingAssignment.findFirst({
      where: {
        booking_id: bookingId,
        consultant_id: consultantId,
      },
      select: { booking_assignment_id: true },
    });
    if (assignment) isAuthorized = true;
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // ✅ บังคับ flow
  if (booking.booking_status !== BookingStatus.ASSIGNED) {
    return NextResponse.json(
      {
        error: `สถานะต้องเป็น ASSIGNED ก่อนรับเคส (ตอนนี้: ${booking.booking_status})`,
        currentStatus: booking.booking_status,
      },
      { status: 409 },
    );
  }

  // ✅ update สถานะ (กัน race — เช็คว่ายังเป็น ASSIGNED อยู่)
  // Authorization ได้ verify ไปแล้วข้างบน ไม่ต้องเช็ค consultant_id อีก
  const upd = await prisma.booking.updateMany({
    where: {
      university_id: activeUniversityId,
      booking_id: bookingId,
      booking_status: BookingStatus.ASSIGNED,
    },
    data: { booking_status: BookingStatus.IN_PROGRESS },
  });

  if (upd.count === 0) {
    // Re-fetch เพื่อหาสถานะปัจจุบัน
    const current = await prisma.booking.findUnique({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: bookingId,
        },
      },
      select: { booking_status: true },
    });
    return NextResponse.json(
      {
        error: "สถานะไม่อนุญาตให้รับเคส หรือรายการถูกเปลี่ยนไปแล้ว",
        currentStatus: current?.booking_status ?? null,
      },
      { status: 409 },
    );
  }

  // ✅ ถ้าเป็น ONLINE และยังไม่มีช่องทาง -> ให้ FE เปิด modal กรอกลิงก์
  const isOnline = upper(booking.serviceMode?.code) === "ONLINE";
  const hasChannel = !!booking.onlineChannel?.online_channel_code;

  return NextResponse.json({
    success: true,
    status: BookingStatus.IN_PROGRESS,
    requireOnlineChannel: isOnline && !hasChannel,
    serviceMode: booking.serviceMode?.code ?? null,
    onlineChannelUrl: booking.onlineChannel?.online_channel_code ?? null,
    onlineChannelNote: null,
  });
}
