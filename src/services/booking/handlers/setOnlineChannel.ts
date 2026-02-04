// src/services/booking/handlers/setOnlineChannel.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { AccountRole, BookingStatus, OnlineChannel, ServiceMode } from "@prisma/client";

type Body = { url?: string; note?: string };

const normUrl = (v: any) => String(v ?? "").trim();
const normNote = (v: any) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

function detectChannelFromUrl(url: string): OnlineChannel {
  const u = url.toLowerCase();
  if (u.includes("meet.google.com")) return OnlineChannel.GOOGLE_MEET;
  if (u.includes("zoom.us") || u.includes("zoom.com")) return OnlineChannel.ZOOM;
  if (u.includes("teams.microsoft.com")) return OnlineChannel.MICROSOFT_TEAMS;
  if (u.startsWith("tel:")) return OnlineChannel.PHONE;
  return OnlineChannel.OTHER;
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

  if ((ctx.role as AccountRole) !== "CONSULTANT") {
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
      booking_service_mode: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  if (booking.consultant_id !== consultantId) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  if (booking.booking_service_mode !== ServiceMode.ONLINE) {
    return NextResponse.json({ error: "เคสนี้ไม่ใช่ ONLINE" }, { status: 409 });
  }

  // flow: ต้อง start ก่อน = IN_PROGRESS
  if (booking.booking_status !== BookingStatus.IN_PROGRESS) {
    return NextResponse.json(
      { error: `ต้องเป็น IN_PROGRESS ก่อนตั้งค่าช่องทาง (ตอนนี้: ${booking.booking_status})` },
      { status: 409 },
    );
  }

  const channel = detectChannelFromUrl(url);

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

      booking_session_mode: ServiceMode.ONLINE,
      booking_session_online_channel: channel,

      booking_session_join_url: url,
      booking_session_extra_detail: note,

      provided_by_account_id: (ctx as any).accountId ?? null,
      provided_at: new Date(),
    },
    update: {
      booking_session_mode: ServiceMode.ONLINE,
      booking_session_online_channel: channel,

      booking_session_join_url: url,
      booking_session_extra_detail: note,

      provided_by_account_id: (ctx as any).accountId ?? null,
      provided_at: new Date(),
    },
  });

  // ✅ optional: sync enum กลับไปที่ Booking ด้วย (ไม่บังคับ แต่ช่วย query ง่าย)
  await prisma.booking.update({
    where: {
      university_id_booking_id: {
        university_id: activeUniversityId,
        booking_id: bookingId,
      },
    },
    data: {
      booking_online_channel: channel,
    },
  });

  return NextResponse.json({ success: true });
}
