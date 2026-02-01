// src/app/api/v2/bookings/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { BookingStatus } from "@prisma/client";

const ALLOWED = ["CONSULTANT", "HEAD_CONSULTANT"] as const;

function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeNextStatus(v: any): BookingStatus | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "IN_PROGRESS") return BookingStatus.IN_PROGRESS;
  if (s === "COMPLETED") return BookingStatus.COMPLETED;
  return null;
}

async function resolveMyConsultantId(params: {
  accountId: number;
  activeUniversityId: number;
}) {
  const row = await prisma.consultant.findFirst({
    where: {
      account_id: params.accountId,
      university_id: params.activeUniversityId,
    },
    select: { consultant_id: true },
  });
  return row?.consultant_id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const bookingId = toInt(params.id);
    if (Number.isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid booking id" },
        { status: 400 },
      );
    }

    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ALLOWED);

    const body = (await req.json().catch(() => ({}))) as { status?: string };
    const nextStatus = normalizeNextStatus(body.status);

    if (!nextStatus) {
      return NextResponse.json(
        { success: false, error: "Status must be IN_PROGRESS or COMPLETED" },
        { status: 400 },
      );
    }

    const role = String(account.role || "").toUpperCase();
    const accountId =
      (account as any).accountId ?? (account as any).account_id ?? null;

    if (typeof accountId !== "number") {
      return NextResponse.json(
        { success: false, error: "accountId missing" },
        { status: 400 },
      );
    }

    // ✅ โหลด booking แบบ tenant-safe (composite key)
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
        booking_status: true,
        consultant_id: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const cur = booking.booking_status;

    // ✅ resolve consultantId ของฉัน (ถ้าเป็น CONSULTANT)
    let myConsultantId: number | null = null;
    if (role === "CONSULTANT") {
      myConsultantId =
        (account as any).consultantId ??
        (account as any).consultant_id ??
        null;

      if (typeof myConsultantId !== "number") {
        myConsultantId = await resolveMyConsultantId({
          accountId,
          activeUniversityId,
        });
      }

      if (typeof myConsultantId !== "number") {
        return NextResponse.json(
          { success: false, error: "Consultant profile not found" },
          { status: 400 },
        );
      }

      // ✅ CONSULTANT ต้องเป็นเคสของตัวเองเท่านั้น
      if (booking.consultant_id !== myConsultantId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: not your booking" },
          { status: 403 },
        );
      }
    }

    // =========================
    // ✅ Rules + Idempotent
    // =========================
    if (nextStatus === BookingStatus.IN_PROGRESS) {
      // อนุญาตเริ่มจาก ASSIGNED เท่านั้น (แนะนำให้ strict)
      // ถ้าคุณอยาก allow จาก PENDING_ASSIGNMENT ด้วย ให้เพิ่มใน array นี้
      const canStartFrom: BookingStatus[] = [
        BookingStatus.ASSIGNED,
        BookingStatus.IN_PROGRESS, // idempotent
      ];

      if (!canStartFrom.includes(cur)) {
        return NextResponse.json(
          { success: false, error: `Cannot start from status ${cur}` },
          { status: 409 },
        );
      }

      // idempotent
      if (cur === BookingStatus.IN_PROGRESS) {
        return NextResponse.json({ success: true, booking });
      }

      // ✅ atomic: updateMany guard ด้วย status เดิม
      const upd = await prisma.booking.updateMany({
        where: {
          university_id: activeUniversityId,
          booking_id: bookingId,
          booking_status: BookingStatus.ASSIGNED,
          ...(role === "CONSULTANT"
            ? { consultant_id: myConsultantId! }
            : {}),
        },
        data: { booking_status: BookingStatus.IN_PROGRESS },
      });

      if (upd.count === 0) {
        return NextResponse.json(
          { success: false, error: "Status changed by someone else" },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        booking: {
          ...booking,
          booking_status: BookingStatus.IN_PROGRESS,
        },
      });
    }

    if (nextStatus === BookingStatus.COMPLETED) {
      // ✅ complete ต้องมาจาก IN_PROGRESS เท่านั้น (กันข้ามขั้น)
      if (cur !== BookingStatus.IN_PROGRESS && cur !== BookingStatus.COMPLETED) {
        return NextResponse.json(
          { success: false, error: `Cannot complete from status ${cur}` },
          { status: 409 },
        );
      }

      // idempotent
      if (cur === BookingStatus.COMPLETED) {
        return NextResponse.json({ success: true, booking });
      }

      // ✅ atomic: updateMany guard
      const upd = await prisma.booking.updateMany({
        where: {
          university_id: activeUniversityId,
          booking_id: bookingId,
          booking_status: BookingStatus.IN_PROGRESS,
          ...(role === "CONSULTANT"
            ? { consultant_id: myConsultantId! }
            : {}),
        },
        data: { booking_status: BookingStatus.COMPLETED },
      });

      if (upd.count === 0) {
        return NextResponse.json(
          { success: false, error: "Status changed by someone else" },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        booking: {
          ...booking,
          booking_status: BookingStatus.COMPLETED,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unhandled" },
      { status: 400 },
    );
  } catch (e: any) {
    console.error("[BOOKING_STATUS_PATCH]", e);
    return NextResponse.json(
      { success: false, error: e?.message ?? "Failed to update status" },
      { status: e?.status ?? 500 },
    );
  }
}
