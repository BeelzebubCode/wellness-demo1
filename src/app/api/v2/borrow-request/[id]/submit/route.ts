import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { submitBorrowRequest } from "@/services/borrowRequests/handlers/submitBorrowRequest";
import { getAccountId } from "@/services/borrowRequests/helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["ADMIN", "HEAD_CONSULTANT"]);

    const borrowRequestId = Number(params.id);
    if (!Number.isFinite(borrowRequestId)) throw new Error("Invalid id");

    const updated = await submitBorrowRequest({
      borrowRequestId,
      activeUniversityId,
      accountId: getAccountId(account),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "Unknown error" }, { status: 400 });
  }
}
