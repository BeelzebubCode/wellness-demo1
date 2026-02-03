// src/app/api/v2/borrow-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import { createBorrowRequest, listMyBorrowRequests } from "@/services/borrowRequests";

export const runtime = "nodejs";

function toBorrowRequestDTO(r: any) {
  return {
    borrowRequestId: r.borrow_request_id,

    fromUniversityId: r.from_university_id,
    fromUniversityCode: r.fromUniversity?.university_code ?? null,
    fromUniversityNameTh: r.fromUniversity?.university_name_th ?? null,

    requestedByAccountId: r.requested_by_account_id,
    requestedByName: null, // ถ้าจะเอาชื่อจริง ต้อง join account เพิ่ม

    borrowRequestTitle: r.borrow_request_title,
    borrowRequestReason: r.borrow_request_reason,
    borrowRequestDetail: r.borrow_request_detail ?? null,

    borrowNeededFrom: r.borrow_needed_from ? new Date(r.borrow_needed_from).toISOString() : null,
    borrowNeededTo: r.borrow_needed_to ? new Date(r.borrow_needed_to).toISOString() : null,
    borrowNeededCount: r.borrow_needed_count,

    borrowRequestStatus: r.borrow_request_status,

    borrowSubmittedAt: r.borrow_submitted_at ? new Date(r.borrow_submitted_at).toISOString() : null,
    borrowApprovedAt: r.borrow_approved_at ? new Date(r.borrow_approved_at).toISOString() : null,
    borrowRejectedAt: r.borrow_rejected_at ? new Date(r.borrow_rejected_at).toISOString() : null,

    borrowRejectReason: r.borrow_reject_reason ?? null,

    borrowRequestCreatedAt: new Date(r.borrow_request_created_at).toISOString(),
    borrowRequestUpdatedAt: new Date(r.borrow_request_updated_at).toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { accountId, universityId } = await requireTenant(req);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;

  const rows = await listMyBorrowRequests({
    accountId,
    universityId,
    status: status as any,
    q,
  });

  return NextResponse.json({
    ok: true,
    data: (rows || []).map(toBorrowRequestDTO),
  });
}

export async function POST(req: NextRequest) {
  const { accountId, universityId } = await requireTenant(req);

  const body = await req.json().catch(() => ({}));

  // ✅ รับได้ทั้ง camelCase และ snake_case
  const title = body.title ?? body.borrow_request_title;
  const reason = body.reason ?? body.borrow_request_reason;
  const detail = body.detail ?? body.borrow_request_detail ?? null;

  const neededFrom = body.neededFrom ?? body.borrow_needed_from ?? null;
  const neededTo = body.neededTo ?? body.borrow_needed_to ?? null;
  const neededCount = body.neededCount ?? body.borrow_needed_count ?? 1;

  const data = await createBorrowRequest({
    universityId,
    requestedByAccountId: accountId,

    borrow_request_title: title,
    borrow_request_reason: reason,
    borrow_request_detail: detail,

    borrow_needed_from: neededFrom,
    borrow_needed_to: neededTo,
    borrow_needed_count: neededCount,
  });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
