import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import { getBorrowRequest } from "@/services/borrowRequests";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function toId(params: { id: string }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw new Error("INVALID_ID");
  return id;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, universityId } = await requireTenant(req);
  const id = toId(ctx.params);

  const data = await getBorrowRequest({
    borrowRequestId: id,
    viewer: { accountId, universityId, mode: "HEAD" },
  });

  return NextResponse.json({ ok: true, data });
}

// PATCH: update/cancel (เฉพาะเจ้าของคำขอ และต้องยังเป็น DRAFT)
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, universityId } = await requireTenant(req);
  const id = toId(ctx.params);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "UPDATE"); // UPDATE | CANCEL

  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: id },
    select: {
      borrow_request_id: true,
      from_university_id: true,
      requested_by_account_id: true,
      borrow_request_status: true,
    },
  });

  if (!br) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (br.from_university_id !== universityId) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN_TENANT" }, { status: 403 });
  }
  if (br.requested_by_account_id !== accountId) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN_OWNER" }, { status: 403 });
  }
  if (br.borrow_request_status !== "DRAFT") {
    return NextResponse.json({ ok: false, error: "ONLY_DRAFT_CAN_EDIT" }, { status: 409 });
  }

  if (action === "CANCEL") {
    const updated = await prisma.borrowRequest.update({
      where: { borrow_request_id: id },
      data: { borrow_request_status: "CANCELLED" },
    });
    return NextResponse.json({ ok: true, data: updated });
  }

  const updated = await prisma.borrowRequest.update({
    where: { borrow_request_id: id },
    data: {
      borrow_request_title: body.title ?? undefined,
      borrow_request_reason: body.reason ?? undefined,
      borrow_request_detail: body.detail ?? undefined,
      borrow_needed_from: body.neededFrom ? new Date(body.neededFrom) : undefined,
      borrow_needed_to: body.neededTo ? new Date(body.neededTo) : undefined,
      borrow_needed_count: body.neededCount ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, data: updated });
}
