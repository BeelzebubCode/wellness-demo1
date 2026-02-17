// src/services/booking/handlers/createBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, ServiceMode } from "@prisma/client";
import crypto from "crypto";

type CreateBookingInput = {
  timeSlotId: number;
  serviceMode: ServiceMode; // ONLINE | ONSITE
  onlineChannelCode?: string | null; // ใช้เมื่อ ONLINE
  problemCategoryId: number;

  bookingDetailText?: string | null;

  // ✅ เพิ่ม: consent + signature
  consentChecked?: boolean;
  agreementSignatureDataUrl?: string | null;

  // ✅ เก็บ meta (ส่งมาจาก route)
  ipAddress?: string | null;
  userAgent?: string | null;
};

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

// ✅ ข้อความ consent (ตอนนี้ fix ไว้ก่อน — เดี๋ยวค่อยอัปเกรดเป็นดึงจาก DB/KB)
const CONSENT_DOC_CODE = "TELEHEALTH_CONSENT";
const CONSENT_DOC_VERSION = 1;
const CONSENT_DOC_TEXT =
  "ข้าพเจ้ายินยอมรับบริการให้คำปรึกษาออนไลน์ และรับทราบเงื่อนไขการให้บริการ รวมถึงการเก็บข้อมูลตามนโยบายความเป็นส่วนตัว";

export async function handleCreateBooking(
  ctx: AccountContext & { activeUniversityId?: number; studentId?: number },
  input: Partial<CreateBookingInput>,
) {
  const activeUniversityId = (ctx as any).activeUniversityId as
    | number
    | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json(
      { error: "activeUniversityId missing" },
      { status: 400 },
    );
  }

  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  const studentId = (ctx as any).studentId as number | undefined;
  if (typeof studentId !== "number") {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 400 },
    );
  }

  const timeSlotId = Number(input.timeSlotId);
  const problemCategoryId = Number(input.problemCategoryId);

  const serviceMode = input.serviceMode;
  const onlineChannelCode = input.onlineChannelCode ? String(input.onlineChannelCode) : null;

  const bookingDetailText = input.bookingDetailText
    ? String(input.bookingDetailText)
    : null;

  const consentChecked = !!input.consentChecked;
  const agreementSignatureDataUrl = input.agreementSignatureDataUrl
    ? String(input.agreementSignatureDataUrl)
    : null;

  const ipAddress = input.ipAddress ? String(input.ipAddress) : null;
  const userAgent = input.userAgent ? String(input.userAgent) : null;

  if (!Number.isFinite(timeSlotId) || !Number.isFinite(problemCategoryId)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (serviceMode !== "ONLINE" && serviceMode !== "ONSITE") {
    return NextResponse.json(
      { error: "serviceMode must be ONLINE or ONSITE" },
      { status: 400 },
    );
  }

  // ✅ บังคับ consent เสมอ (ตาม UI)
  if (!consentChecked) {
    return NextResponse.json({ error: "Consent is required" }, { status: 400 });
  }

  if (serviceMode === "ONLINE") {
    if (!onlineChannelCode) {
      return NextResponse.json(
        { error: "onlineChannelCode is required for ONLINE booking" },
        { status: 400 },
      );
    }
    if (!agreementSignatureDataUrl) {
      return NextResponse.json(
        { error: "agreementSignatureDataUrl is required for ONLINE booking" },
        { status: 400 },
      );
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findUnique({
        where: {
          university_id_time_slot_id: {
            university_id: activeUniversityId,
            time_slot_id: timeSlotId,
          },
        },
        select: {
          time_slot_id: true,
          university_id: true,
          time_slot_max_capacity: true,
          time_slot_status: true,
        },
      });

      if (!slot)
        throw Object.assign(new Error("Time slot not found"), { status: 404 });
      if (slot.time_slot_status !== "OPEN") {
        throw Object.assign(new Error("Time slot is not open"), {
          status: 409,
        });
      }

      const count = await tx.booking.count({
        where: {
          university_id: activeUniversityId,
          time_slot_id: timeSlotId,
          booking_status: {
            in: [
              BookingStatus.PENDING_ASSIGNMENT,
              BookingStatus.ASSIGNED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (count >= slot.time_slot_max_capacity) {
        throw Object.assign(new Error("Time slot is full"), { status: 409 });
      }

      const pending = await tx.booking.findFirst({
        where: {
          student_id: studentId,
          university_id: activeUniversityId,
          booking_status: {
            in: [
              BookingStatus.PENDING_ASSIGNMENT,
              BookingStatus.ASSIGNED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
        select: { booking_id: true },
      });

      if (pending) {
        throw Object.assign(new Error("You already have an active booking"), {
          status: 409,
        });
      }

      let onlineChannelCategoryId: number | null = null;
      if (serviceMode === 'ONLINE' && onlineChannelCode) {
          const channel = await tx.onlineChannelCategory.findFirst({
              where: { online_channel_code: onlineChannelCode }
          });
          if (!channel) {
              throw Object.assign(new Error("Invalid online channel code"), { status: 400 });
          }
          onlineChannelCategoryId = channel.online_channel_category_id;
      }

      const booking = await tx.booking.create({
        data: {
          university_id: activeUniversityId,
          student_id: studentId,
          time_slot_id: timeSlotId,

          booking_service_mode: serviceMode,
          online_channel_category_id: onlineChannelCategoryId,

          problem_category_id: problemCategoryId,
          booking_detail_text: bookingDetailText,
          booking_status: BookingStatus.PENDING_ASSIGNMENT,
        },
        select: { booking_id: true, university_id: true },
      });

        if (serviceMode === "ONLINE") {
          // agreementSignatureDataUrl is required for ONLINE
          if (!agreementSignatureDataUrl) {
             throw new Error("Signature is required for online booking");
          }

          // Create the consent signature record
          await tx.bookingAgreementSignature.create({
            data: {
              university_id: booking.university_id,
              booking_id: booking.booking_id,
              student_id: studentId, // Required by new schema
              signature_method: "DRAW",
              signature_payload: { dataUrl: agreementSignatureDataUrl }, // Store as JSON
            },
          });
        }


      return booking;
    });

    return NextResponse.json({
      success: true,
      bookingId: created.booking_id,
      universityId: created.university_id,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 409 },
      );
    }
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? "Failed to create booking" },
      { status },
    );
  }
}
