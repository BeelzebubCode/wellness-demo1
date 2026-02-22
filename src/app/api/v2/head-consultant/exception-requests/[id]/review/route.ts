// src/app/api/v2/head-consultant/exception-requests/[id]/review/route.ts
// PATCH: APPROVE or REJECT an exception request
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";
import { rollbackPenalty } from "@/services/booking/penaltyEngine";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req);
    const { account } = tenant;

    if (account.role !== "HEAD_CONSULTANT") {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const action: "APPROVE" | "REJECT" = body.action;
    const decisionNote = String(body.decision_note ?? "").trim() || null;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ success: false, error: "action ต้องเป็น APPROVE หรือ REJECT" }, { status: 400 });
    }

    const request = await prisma.bookingExceptionRequest.findUnique({
      where: { booking_exception_request_id: requestId },
      include: { student: true },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอ" }, { status: 404 });
    }

    if (request.booking_exception_status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { success: false, error: "คำขอนี้ยังไม่อยู่ในสถานะ PENDING_REVIEW" },
        { status: 409 },
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    await prisma.$transaction(async (tx) => {
      // Update requests status
      await tx.bookingExceptionRequest.update({
        where: { booking_exception_request_id: requestId },
        data: {
          booking_exception_status: newStatus,
          booking_exception_reviewed_by_id: account.accountId,
          booking_exception_reviewed_at: new Date(),
          booking_exception_decision_note: decisionNote,
        },
      });

      // If APPROVE → rollback penalty
      if (action === "APPROVE") {
        await rollbackPenalty(tx as any, {
          universityId: request.university_id,
          studentId: request.student_id,
          exceptionRequestId: requestId,
          actorAccountId: account.accountId,
        });
      }
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (e: any) {
    console.error("[PATCH /api/v2/head-consultant/exception-requests/:id/review]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
