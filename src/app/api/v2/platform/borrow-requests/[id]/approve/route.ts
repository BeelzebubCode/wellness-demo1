// src/app/api/v2/platform/borrow-requests/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { platformApproveBorrowRequest } from "@/services/borrowRequests";
import { getAccountId } from "@/services/borrowRequests/helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { account } = await requireTenant(req);
  assertRole(account.role, ["SUPER_ADMIN"]);

  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }

  const data = await platformApproveBorrowRequest({
    borrowRequestId: id,
    accountId: getAccountId(account),
  });

  return NextResponse.json({ ok: true, data });
}
