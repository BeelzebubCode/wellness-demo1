// src/app/api/v2/platform/borrow-requests/[id]/candidates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { getAccountId } from "@/services/borrow-requests/helpers";
import { platformListBorrowCandidates } from "@/services/borrow-requests/handlers/platformListBorrowCandidates";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { account } = await requireTenant(req);
    assertRole(account.role, ["SUPER_ADMIN"]);

    const borrowRequestId = Number(params.id);
    if (!Number.isFinite(borrowRequestId) || borrowRequestId <= 0) {
      return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const fromUniversityIdParam = searchParams.get("fromUniversityId");
    const fromUniversityId =
      fromUniversityIdParam && String(fromUniversityIdParam).trim()
        ? Number(fromUniversityIdParam)
        : undefined;

    const data = await platformListBorrowCandidates({
      accountId: getAccountId(account),
      borrowRequestId,
      fromUniversityId,
    });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("❌ Borrow candidates error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "Unknown error",
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
      },
      { status: 400 }
    );
  }
}
