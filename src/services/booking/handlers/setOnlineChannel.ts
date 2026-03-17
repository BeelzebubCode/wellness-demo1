// src/services/booking/handlers/setOnlineChannel.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus } from "@prisma/client";
import { OnlineChannelCode } from "@/lib/constants/booking-service";

type Body = { url?: string; note?: string };

const normUrl = (v: any) => String(v ?? "").trim();
const normNote = (v: any) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

function detectChannelFromUrl(url: string): OnlineChannelCode {
  const u = url.toLowerCase().trim();
  if (u.includes("meet.google.com")) return OnlineChannelCode.GOOGLE_MEET;
  if (u.includes("zoom.us") || u.includes("zoom.com")) return OnlineChannelCode.ZOOM;
  if (u.includes("teams.microsoft.com")) return OnlineChannelCode.MICROSOFT_TEAMS;
  
  // ✅ Detect phone: tel: or starts with digits (e.g. 02, 08, 09)
  if (u.startsWith("tel:") || /^[0-9+ ]{3,15}$/.test(u.replace(/[-\s]/g, ""))) {
    return OnlineChannelCode.PHONE;
  }

  return OnlineChannelCode.OTHER;
}

export async function handleSetOnlineChannel(
  ctx: AccountContext & { activeUniversityId?: number },
  bookingIdRaw: string,
  body: Body,
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  if (ctx.role !== "CONSULTANT" && ctx.role !== "HEAD_CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const consultantId = (ctx as any).consultantId as number | undefined;
  if (typeof consultantId !== "number") {
    return NextResponse.json({ error: "Missing consultant id" }, { status: 400 });
  }

  const url = normUrl(body?.url);
  if (!url) {
    return NextResponse.json({ error: "กรุณาระบุ url/channel" }, { status: 400 });
  }
  const note = normNote(body?.note);

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
    },
  });

  if (!booking) return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
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

  if (booking.serviceMode?.code !== "ONLINE") {
    return NextResponse.json({ error: "เคสนี้ไม่ใช่ ONLINE" }, { status: 409 });
  }

  // flow: ต้อง start ก่อน = IN_PROGRESS
  if (booking.booking_status !== BookingStatus.IN_PROGRESS) {
    return NextResponse.json(
      { error: `ต้องเป็น IN_PROGRESS ก่อนตั้งค่าช่องทาง (ตอนนี้: ${booking.booking_status})` },
      { status: 409 },
    );
  }

  const channelCode = detectChannelFromUrl(url);
  const isPhone = channelCode === OnlineChannelCode.PHONE;

  const category = await prisma.onlineChannelCategory.findFirst({
      where: { online_channel_code: channelCode }
  });
  const categoryId = category?.online_channel_category_id ?? null;

  // ✅ ของ schema ใหม่: เก็บลง BookingSession (upsert)
  await prisma.bookingSession.upsert({
    where: {
      university_id_booking_id: {
        university_id: activeUniversityId,
        booking_id: bookingId,
      },
    },
    create: {
      university_id: activeUniversityId,
      booking_id: bookingId,


      service_mode_id: booking.service_mode_id,
      online_channel_category_id: categoryId,

      booking_session_join_url: isPhone ? null : url,
      booking_session_phone_number: isPhone ? url.replace("tel:", "") : null,
      booking_session_extra_detail: note,

      provided_by_account_id: (ctx as any).accountId ?? null,
      provided_at: new Date(),
    },
    update: {
      service_mode_id: booking.service_mode_id,
      online_channel_category_id: categoryId,

      booking_session_join_url: isPhone ? null : url,
      booking_session_phone_number: isPhone ? url.replace("tel:", "") : null,
      booking_session_extra_detail: note,

      provided_by_account_id: (ctx as any).accountId ?? null,
      provided_at: new Date(),
    },
  });

  // ✅ optional: sync enum กลับไปที่ Booking ด้วย => ยกเลิกเพราะ field ถูกลบแล้ว

  return NextResponse.json({ success: true });
}
