import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import { createBorrowRequest } from "@/services/borrowRequests";
import { listMyBorrowRequests } from "@/services/borrowRequests";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { accountId, universityId } = await requireTenant(req);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;

  const data = await listMyBorrowRequests({
    accountId,
    universityId,
    status: status as any,
    q,
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const { accountId, universityId } = await requireTenant(req);

  const body = await req.json().catch(() => ({}));
  const data = await createBorrowRequest({
    universityId,
    requestedByAccountId: accountId,
    title: body.title,
    reason: body.reason,
    detail: body.detail,
    neededFrom: body.neededFrom,
    neededTo: body.neededTo,
    neededCount: body.neededCount,
  });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
