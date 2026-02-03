// src/app/api/v2/borrow-request/[id]/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import { submitBorrowRequest } from "@/services/borrowRequests";

export const runtime = "nodejs";

function toId(idStr: string) {
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) throw new Error("INVALID_ID");
  return id;
}

function isoOrNull(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ✅ ส่งกลับเป็น camelCase ให้เข้ากับ BorrowRequest type ฝั่ง FE
function toBorrowRequestDTO(r: any) {
  return {
    borrowRequestId: r.borrow_request_id,

    fromUniversityId: r.from_university_id,
    fromUniversityCode: r.fromUniversity?.university_code ?? null,
    fromUniversityNameTh: r.fromUniversity?.university_name_th ?? null,

    requestedByAccountId: r.requested_by_account_id,
    requestedByName: null,

    borrowRequestTitle: r.borrow_request_title,
    borrowRequestReason: r.borrow_request_reason,
    borrowRequestDetail: r.borrow_request_detail ?? null,

    borrowNeededFrom: isoOrNull(r.borrow_needed_from),
    borrowNeededTo: isoOrNull(r.borrow_needed_to),
    borrowNeededCount: r.borrow_needed_count,

    borrowRequestStatus: r.borrow_request_status,

    borrowSubmittedAt: isoOrNull(r.borrow_submitted_at),
    borrowApprovedAt: isoOrNull(r.borrow_approved_at),
    borrowRejectedAt: isoOrNull(r.borrow_rejected_at),

    borrowRejectReason: r.borrow_reject_reason ?? null,

    borrowRequestCreatedAt: isoOrNull(r.borrow_request_created_at),
    borrowRequestUpdatedAt: isoOrNull(r.borrow_request_updated_at),
  };
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { accountId, universityId } = await requireTenant(req);
    const id = toId(ctx.params.id);

    const body = await req.json().catch(() => ({}));

    // รองรับทั้ง note และ borrow_submit_note
    const noteRaw =
      typeof body?.borrow_submit_note === "string"
        ? body.borrow_submit_note
        : typeof body?.note === "string"
          ? body.note
          : null;

    const note = noteRaw ? String(noteRaw).trim() : undefined;

    const row = await submitBorrowRequest({
      borrowRequestId: id,
      accountId,
      universityId,
      note,
    });

    // เผื่อ service คืน null
    if (!row) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toBorrowRequestDTO(row) });
  } catch (e: any) {
    const msg = String(e?.message || "SUBMIT_FAILED");
    const status =
      msg === "INVALID_ID" ? 400 :
      msg === "FORBIDDEN" ? 403 :
      msg === "ONLY_DRAFT_CAN_SUBMIT" ? 409 :
      400;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
