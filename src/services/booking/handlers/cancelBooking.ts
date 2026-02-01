// src/services/booking/handlers/cancelBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertRole, type TenantContext } from "@/lib/tenant/server";
import { BookingStatus, TimeSlotStatus } from "@prisma/client";

type Input = {
  tenant: TenantContext;
  bookingIdRaw: string;
  body: any;
};

function toInt(idRaw: string) {
  const n = Number(idRaw);
  return Number.isFinite(n) ? n : NaN;
}

export async function handleCancelBooking({ tenant, bookingIdRaw, body }: Input) {
  const { account, activeUniversityId } = tenant;

  assertRole(String(account.role || "").toUpperCase(), ["STUDENT"]);

  const bookingId = toInt(bookingIdRaw);
  if (Number.isNaN(bookingId)) {
    return NextResponse.json({ success: false, error: "Invalid booking ID" }, { status: 400 });
  }

  const cancelReason = String(body?.cancelReason ?? "").trim();
  if (!cancelReason) {
    return NextResponse.json({ success: false, error: "กรุณากรอกเหตุผลในการยกเลิก" }, { status: 400 });
  }

  // ✅ โหลด booking แบบ tenant-safe + owner-safe
  const booking = await prisma.booking.findFirst({
    where: {
      booking_id: bookingId,
      university_id: activeUniversityId,
      student: { is: { account_id: account.accountId } },
    },
    select: {
      booking_id: true,
      university_id: true,
      time_slot_id: true,
      booking_status: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  if (
    booking.booking_status === BookingStatus.CANCELLED ||
    booking.booking_status === BookingStatus.COMPLETED
  ) {
    return NextResponse.json({ success: false, error: "ไม่สามารถยกเลิกสถานะนี้ได้" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    // ✅ update booking ด้วย composite key
    await tx.booking.update({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: bookingId,
        },
      },
      data: { booking_status: BookingStatus.CANCELLED },
    });

    // ✅ upsert cancellation ด้วย composite key
    await tx.bookingCancellation.upsert({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: bookingId,
        },
      },
      update: {
        booking_cancellation_cancelled_by_id: account.accountId,
        booking_cancellation_reason: cancelReason,
      },
      create: {
        university_id: activeUniversityId,
        booking_id: bookingId,
        booking_cancellation_cancelled_by_id: account.accountId,
        booking_cancellation_reason: cancelReason,
      },
    });

    // ✅ slot ต้อง query ด้วย composite key
    const slot = await tx.timeSlot.findUnique({
      where: {
        university_id_time_slot_id: {
          university_id: activeUniversityId,
          time_slot_id: booking.time_slot_id,
        },
      },
      select: {
        time_slot_id: true,
        time_slot_max_capacity: true,
      },
    });

    if (!slot) return;

    // ✅ count เฉพาะ tenant นี้
    const activeCount = await tx.booking.count({
      where: {
        university_id: activeUniversityId,
        time_slot_id: slot.time_slot_id,
        booking_status: {
          in: [
            BookingStatus.PENDING_ASSIGNMENT,
            BookingStatus.ASSIGNED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      },
    });

    const cap = Number(slot.time_slot_max_capacity ?? 0);
    const nextStatus = activeCount < cap ? TimeSlotStatus.OPEN : TimeSlotStatus.FULL;

    await tx.timeSlot.update({
      where: {
        university_id_time_slot_id: {
          university_id: activeUniversityId,
          time_slot_id: slot.time_slot_id,
        },
      },
      data: { time_slot_status: nextStatus },
    });
  });

  return NextResponse.json({ success: true, status: BookingStatus.CANCELLED });
}
