// src/app/api/v2/exception-requests/[reqId]/evidences/route.ts
// Append file evidence URLs to a DRAFT exception request
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

type Params = { params: { reqId: string } };

export async function POST(req: NextRequest, { params }: Params) {
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
      },
    });

    if (!exceptionRequest) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอยกเว้นโทษ" }, { status: 404 });
    }

    // Must be owner
    if (exceptionRequest.student.account_id !== account.accountId) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    // Must be still in DRAFT (not reviewed yet)
    if (!["DRAFT", "PENDING_REVIEW"].includes(exceptionRequest.booking_exception_status)) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถเพิ่มหลักฐานหลังจาก reviewed แล้ว" },
        { status: 422 },
      );
    }

    // Only allow DRAFT
    if (exceptionRequest.booking_exception_status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถเพิ่มหลักฐานหลังส่งคำขอแล้ว" },
        { status: 422 },
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const evidences: Array<{
      file_url: string;
      file_name?: string;
      file_type?: string;
      file_size?: number;
    }> = Array.isArray(body.evidences) ? body.evidences : [];

    if (evidences.length === 0) {
      return NextResponse.json({ success: false, error: "กรุณาระบุหลักฐานอย่างน้อย 1 รายการ" }, { status: 400 });
    }

    const created = await prisma.bookingExceptionEvidence.createMany({
      data: evidences.map((e) => ({
        booking_exception_request_id: requestId,
        booking_exception_evidence_url: e.file_url,
        booking_exception_evidence_name: e.file_name ?? null,
        booking_exception_evidence_type: e.file_type ?? null,
        booking_exception_evidence_size: e.file_size ?? null,
      })),
    });

    return NextResponse.json({ success: true, count: created.count }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/v2/exception-requests/:reqId/evidences]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
