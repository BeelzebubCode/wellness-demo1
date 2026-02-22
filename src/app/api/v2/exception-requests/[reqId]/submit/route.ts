// src/app/api/v2/exception-requests/[reqId]/submit/route.ts
// Change DRAFT → PENDING_REVIEW
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

type Params = { params: { reqId: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req);
    const { account } = tenant;

    if (account.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const requestId = Number(params.reqId);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid request ID" }, { status: 400 });
    }

    const exceptionRequest = await prisma.bookingExceptionRequest.findUnique({
      where: { booking_exception_request_id: requestId },
      include: {
        student: { select: { account_id: true } },
        evidences: { select: { booking_exception_evidence_id: true } },
      },
    });

    if (!exceptionRequest) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอยกเว้นโทษ" }, { status: 404 });
    }

    if (exceptionRequest.student.account_id !== account.accountId) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    if (exceptionRequest.booking_exception_status !== "DRAFT") {
      return NextResponse.json({ success: false, error: "คำขอนี้ถูกส่งแล้วหรือ reviewed แล้ว" }, { status: 409 });
    }

    // Check deadline
    if (
      exceptionRequest.booking_exception_deadline_at &&
      new Date() > exceptionRequest.booking_exception_deadline_at
    ) {
      return NextResponse.json({ success: false, error: "หมดเวลายื่นคำขอแล้ว" }, { status: 422 });
    }

    const updated = await prisma.bookingExceptionRequest.update({
      where: { booking_exception_request_id: requestId },
      data: {
        booking_exception_status: "PENDING_REVIEW",
        booking_exception_submitted_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    console.error("[PATCH /api/v2/exception-requests/:reqId/submit]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
