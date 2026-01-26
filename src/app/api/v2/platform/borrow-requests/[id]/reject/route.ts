import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { platformRejectBorrowRequest } from "@/services/borrowRequests";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, role } = await requireTenant(req);
  assertRole(role, ["SUPER_ADMIN"]);

  const id = Number(ctx.params.id);
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || "").trim();
  if (!reason) return NextResponse.json({ ok: false, error: "REASON_REQUIRED" }, { status: 400 });

  const data = await platformRejectBorrowRequest({ borrowRequestId: id, accountId, reason });

  return NextResponse.json({ ok: true, data });
}
