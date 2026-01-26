import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { getBorrowRequest } from "@/services/borrowRequests";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, role } = await requireTenant(req);
  assertRole(role, ["SUPER_ADMIN"]);

  const id = Number(ctx.params.id);
  const data = await getBorrowRequest({
    borrowRequestId: id,
    viewer: { accountId, mode: "PLATFORM" },
  });

  return NextResponse.json({ ok: true, data });
}
