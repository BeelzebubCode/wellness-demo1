// src/app/api/v2/head-consultant/exception-requests/[id]/route.ts
// GET: Exception request detail
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
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

    const request = await prisma.bookingExceptionRequest.findUnique({
      where: { booking_exception_request_id: requestId },
      include: {
        evidences: true,
        student: {
          include: {
            profile: true,
            trustStatus: true,
          },
        },
        booking: {
          include: {
            timeSlot: true,
            attendance: true,
            cancellation: { include: { cancellationReason: true } },
            problemCategory: true,
          },
        },
        reviewedBy: {
          select: { account_id: true, account_username: true },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอ" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (e: any) {
    console.error("[GET /api/v2/head-consultant/exception-requests/:id]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
