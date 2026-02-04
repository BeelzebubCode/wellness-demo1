// src/app/api/v2/platform/borrow-requests/[id]/approve/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { platformApproveBorrowRequest } from "@/services/borrowRequests";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, role } = await requireTenant(req);
  assertRole(role, ["SUPER_ADMIN"]);

  const id = Number(ctx.params.id);
  const data = await platformApproveBorrowRequest({
    borrowRequestId: id,
    accountId,
  });

  return NextResponse.json({ ok: true, data });
}
