// src/app/api/v2/bookings/[id]/exception-request/route.ts
/**
 * Flow #2: Student creates an exception request AFTER cancelling.
 * Status starts as DRAFT. Student can then add evidences and submit.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

const DEADLINE_DAYS = 3;

type Params = { params: { id: string } };

// GET — student views their own exception request for this booking
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req);
    const { account, activeUniversityId } = tenant;

    if (account.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const bookingId = Number(params.id);

    const request = await prisma.bookingExceptionRequest.findUnique({
      where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } },
      include: { evidences: true },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอยกเว้นโทษ" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST — create DRAFT exception request (Flow #2)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req);
    const { account, activeUniversityId } = tenant;

    if (account.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const bookingId = Number(params.id);
    if (!Number.isFinite(bookingId)) {
      return NextResponse.json({ success: false, error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const reasonCode = String(body.reason_code ?? "").trim();
    const reasonDetail = String(body.reason_detail ?? "").trim();

    if (!reasonCode || !reasonDetail) {
      return NextResponse.json({ success: false, error: "กรุณากรอกเหตุผลและรายละเอียด" }, { status: 400 });
    }

    // Verify the booking belongs to this student and is CANCELLED
    const booking = await prisma.booking.findFirst({
      where: {
        booking_id: bookingId,
        university_id: activeUniversityId,
        student: { is: { account_id: account.accountId } },
        booking_status: "CANCELLED",
      },
      include: {
        cancellation: { select: { booking_cancellation_cancelled_at: true } },
        student: { select: { student_id: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "ไม่พบรายการจองที่ถูกยกเลิก หรือไม่ใช่ของท่าน" },
        { status: 404 },
      );
    }

    // Check deadline
    const cancelledAt = booking.cancellation?.booking_cancellation_cancelled_at ?? booking.booking_created_at;
    const deadline = new Date(cancelledAt);
    deadline.setDate(deadline.getDate() + DEADLINE_DAYS);

    if (new Date() > deadline) {
      return NextResponse.json(
        { success: false, error: `หมดเวลายื่นขอยกเว้นโทษแล้ว (ภายใน ${DEADLINE_DAYS} วัน)` },
        { status: 422 },
      );
    }

    // Check for existing request
    const existing = await prisma.bookingExceptionRequest.findUnique({
      where: { university_id_booking_id: { university_id: activeUniversityId, booking_id: bookingId } },
    });

    if (existing) {
      if (existing.booking_exception_status === "REJECTED") {
        // Reset the request to DRAFT and clear previous evidences if it was rejected
        await prisma.bookingExceptionEvidence.deleteMany({
          where: { booking_exception_request_id: existing.booking_exception_request_id }
        });

        const updatedRequest = await prisma.bookingExceptionRequest.update({
          where: { booking_exception_request_id: existing.booking_exception_request_id },
          data: {
            booking_exception_reason_code: reasonCode,
            booking_exception_reason_detail: reasonDetail,
            booking_exception_status: "DRAFT",
            booking_exception_decision_note: null,
            booking_exception_reviewed_by_id: null,
            booking_exception_reviewed_at: null,
            booking_exception_submitted_at: null,
          }
        });

        return NextResponse.json({ success: true, data: updatedRequest }, { status: 200 });
      }

      return NextResponse.json(
        { success: false, error: "มีคำขอยกเว้นโทษสำหรับรายการจองนี้แล้ว" },
        { status: 409 },
      );
    }

    const request = await prisma.bookingExceptionRequest.create({
      data: {
        university_id: activeUniversityId,
        booking_id: bookingId,
        student_id: booking.student!.student_id,
        booking_exception_reason_code: reasonCode,
        booking_exception_reason_detail: reasonDetail,
        booking_exception_status: "DRAFT",
        booking_exception_deadline_at: deadline,
      },
    });

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/v2/bookings/:id/exception-request]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
