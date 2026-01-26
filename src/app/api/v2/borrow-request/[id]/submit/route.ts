import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import { submitBorrowRequest } from "@/services/borrowRequests";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, universityId } = await requireTenant(req);
  const id = Number(ctx.params.id);

  const body = await req.json().catch(() => ({}));
  const note = body.note as string | undefined;

  const data = await submitBorrowRequest({
    borrowRequestId: id,
    accountId,
    universityId,
    note,
  });

  return NextResponse.json({ ok: true, data });
}
