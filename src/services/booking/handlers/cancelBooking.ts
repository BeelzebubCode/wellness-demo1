// src/services/booking/handlers/cancelBooking.ts
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

  // ✅ เฉพาะ STUDENT ยกเลิกเอง
  assertRole(String(account.role || "").toUpperCase(), ["STUDENT"]);

  const bookingId = toInt(bookingIdRaw);
  if (Number.isNaN(bookingId)) {
    return { success: false, error: "Invalid booking ID" };
  }

  const cancelReason = String(body?.cancelReason ?? "").trim();
  if (!cancelReason) {
    return { success: false, error: "กรุณากรอกเหตุผลในการยกเลิก" };
  }

  // โหลด booking แบบ tenant-safe + owner-safe
  const booking = await prisma.booking.findFirst({
    where: {
      booking_id: bookingId,
      university_id: activeUniversityId, // ✅ แยกตามมหาลัยทันที
      student: { is: { account_id: account.accountId } }, // ✅ เจ้าของเท่านั้น
    },
    select: {
      booking_id: true,
      time_slot_id: true,
      booking_status: true,
    },
  });

  if (!booking) {
    // จะเป็น not found หรือ tenant/owner ไม่ผ่านก็จะมาทางนี้ (ปลอดภัย)
    return { success: false, error: "ไม่พบรายการจอง" };
  }

  // กันยกเลิกซ้ำ/ยกเลิกหลังปิดเคส
  if (booking.booking_status === BookingStatus.CANCELLED || booking.booking_status === BookingStatus.COMPLETED) {
    return { success: false, error: "ไม่สามารถยกเลิกสถานะนี้ได้" };
  }

  await prisma.$transaction(async (tx) => {
    // 1) update booking status
    await tx.booking.update({
      where: { booking_id: bookingId },
      data: { booking_status: BookingStatus.CANCELLED },
    });

    // 2) upsert cancellation row
    await tx.bookingCancellation.upsert({
      where: { booking_id: bookingId },
      update: {
        booking_cancellation_cancelled_by_id: account.accountId,
        booking_cancellation_reason: cancelReason,
      },
      create: {
        booking_id: bookingId,
        booking_cancellation_cancelled_by_id: account.accountId,
        booking_cancellation_reason: cancelReason,
      },
    });

    // 3) refresh slot status (คิวรวม/หลายคนจองได้)
    const slot = await tx.timeSlot.findUnique({
      where: { time_slot_id: booking.time_slot_id },
      select: { time_slot_id: true, time_slot_max_capacity: true },
    });

    if (!slot) return;

    const activeCount = await tx.booking.count({
      where: {
        time_slot_id: slot.time_slot_id,
        booking_status: { in: [BookingStatus.PENDING_ASSIGNMENT, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
      },
    });

    const cap = Number(slot.time_slot_max_capacity ?? 0);
    const nextStatus = activeCount < cap ? TimeSlotStatus.OPEN : TimeSlotStatus.FULL;

    await tx.timeSlot.update({
      where: { time_slot_id: slot.time_slot_id },
      data: { time_slot_status: nextStatus },
    });
  });

  return { success: true, status: BookingStatus.CANCELLED };
}
