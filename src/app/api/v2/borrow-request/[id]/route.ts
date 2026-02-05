// src/app/api/v2/borrow-request/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { getBorrowRequest } from "@/services/borrowRequests/handlers/getBorrowRequest";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { account } = await requireTenant(req);
    assertRole(account.role, [
      "SUPER_ADMIN",
      "RECTOR",
      "HEAD_CONSULTANT",
      "COUNSELING_ADMIN",
    ]);

    const borrowRequestId = Number(params.id);
    if (!Number.isFinite(borrowRequestId)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    const data = await getBorrowRequest({
      borrowRequestId,
      includeRanking: true,
    });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, [
      "HEAD_CONSULTANT",
      "COUNSELING_ADMIN",
    ]);

    const borrowRequestId = Number(params.id);
    if (!Number.isFinite(borrowRequestId)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Import the update handler
    const { updateBorrowRequest } = await import("@/services/borrowRequests/handlers/updateBorrowRequest");

    // Parse body for update or cancel
    const patch: any = {};

    // Handle cancel (status: "CANCELLED")
    if (body.status === "CANCELLED") {
      // Cancel functionality - update status to CANCELLED
      const updated = await import("@/lib/prisma").then(m => m.default.borrowRequest.update({
        where: { borrow_request_id: borrowRequestId },
        data: { borrow_request_status: "CANCELLED" }
      }));
      return NextResponse.json({ ok: true, data: updated });
    }

    // Handle regular update
    if (body.title) patch.title = body.title;
    if (body.reason) patch.reason = body.reason;
    if (body.detail !== undefined) patch.detailJson = body.detail;
    if (body.neededFrom !== undefined) patch.neededFrom = body.neededFrom ? new Date(body.neededFrom) : null;
    if (body.neededTo !== undefined) patch.neededTo = body.neededTo ? new Date(body.neededTo) : null;
    if (body.neededCount !== undefined) patch.neededCount = body.neededCount;

    const data = await updateBorrowRequest({
      borrowRequestId,
      accountId: account.accountId,
      fromUniversityId: activeUniversityId!,
      patch,
    });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
