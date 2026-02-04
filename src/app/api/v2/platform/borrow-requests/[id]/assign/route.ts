// src/app/api/v2/platform/borrow-requests/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { platformAssignBorrowRequest } from "@/services/borrowRequests/handlers/platformAssignBorrowRequest";
import { getAccountId } from "@/services/borrowRequests/helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { account } = await requireTenant(req);
    assertRole(account.role, ["SUPER_ADMIN"]);

    const borrowRequestId = Number(params.id);
    if (!Number.isFinite(borrowRequestId)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();

    const result = await platformAssignBorrowRequest({
      borrowRequestId,
      assignedByAccountId: getAccountId(account),
      body,
    });

    // ✅ FE คาดว่า data เป็น BorrowRequestDetail
    return NextResponse.json({ ok: true, data: result.request });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
