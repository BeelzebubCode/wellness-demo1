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

