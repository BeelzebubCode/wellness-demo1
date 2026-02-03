// src/app/api/v2/borrow-request/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";
import { getBorrowRequest } from "@/services/borrowRequests";

export const runtime = "nodejs";

function toId(params: { id: string }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw new Error("INVALID_ID");
  return id;
}

function isoOrNull(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toBorrowRequestDTO(r: any) {
  return {
    borrowRequestId: r.borrow_request_id,

    fromUniversityId: r.from_university_id,
    fromUniversityCode: r.fromUniversity?.university_code ?? null,
    fromUniversityNameTh: r.fromUniversity?.university_name_th ?? null,

    requestedByAccountId: r.requested_by_account_id,
    requestedByName: null, // ถ้าจะเอาชื่อ ต้อง join account เพิ่ม

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

function toBorrowAssignmentDTO(a: any) {
  const consultantName =
    a.consultant?.profile?.consultant_name_th ??
    a.consultant?.profile?.full_name_th ??
    a.consultant?.profile?.display_name ??
    null;

  return {
    borrowAssignmentId: a.borrow_assignment_id,
    borrowRequestId: a.borrow_request_id,

    consultantId: a.consultant_id,
    consultantUniversityId: a.consultant_university_id,
    consultantName,
    consultantUniversityCode: a.consultantUniversity?.university_code ?? null,

    borrowAssignStartAt: isoOrNull(a.borrow_assign_start_at),
    borrowAssignEndAt: isoOrNull(a.borrow_assign_end_at),

    borrowAssignedByAccountId: a.borrow_assigned_by_account_id,
    borrowAssignedAt: isoOrNull(a.borrow_assigned_at),
    borrowAssignmentNote: a.borrow_assignment_note ?? null,
  };
}

function toBorrowRequestDetailDTO(r: any) {
  return {
    ...toBorrowRequestDTO(r),
    assignments: (r.assignments || []).map(toBorrowAssignmentDTO),
  };
}

async function findBorrowRequestOwnerGuard(params: {
  id: number;
  universityId: number;
  accountId: number;
}) {
  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: params.id },
    select: {
      borrow_request_id: true,
      from_university_id: true,
      requested_by_account_id: true,
      borrow_request_status: true,
    },
  });

  if (!br) return { ok: false as const, status: 404, error: "NOT_FOUND" };
  if (br.from_university_id !== params.universityId)
    return { ok: false as const, status: 403, error: "FORBIDDEN_TENANT" };
  if (br.requested_by_account_id !== params.accountId)
    return { ok: false as const, status: 403, error: "FORBIDDEN_OWNER" };

  return { ok: true as const, br };
}

// ----------
// GET detail
// ----------
export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, universityId } = await requireTenant(req);
  const id = toId(ctx.params);

  const row = await getBorrowRequest({
    borrowRequestId: id,
    viewer: { accountId, universityId, mode: "HEAD" },
  });

  if (!row) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: toBorrowRequestDetailDTO(row) });
}

// ------------------------
// PATCH update / cancel
// - update/cancel ได้เฉพาะเจ้าของคำขอ
// - ตอนนี้ล็อกไว้เฉพาะ DRAFT (เหมือนของคุณ)
// ------------------------
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, universityId } = await requireTenant(req);
  const id = toId(ctx.params);

  const body = await req.json().catch(() => ({}));

  // รองรับทั้ง:
  // 1) { action: "CANCEL" }
  // 2) { status: "CANCELLED" }  <-- frontend ของคุณส่งแบบนี้
  const action = String(
    body.action || (body.status === "CANCELLED" ? "CANCEL" : "UPDATE"),
  ).toUpperCase(); // UPDATE | CANCEL

  const guard = await findBorrowRequestOwnerGuard({ id, universityId, accountId });
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  if (guard.br.borrow_request_status !== "DRAFT") {
    return NextResponse.json({ ok: false, error: "ONLY_DRAFT_CAN_EDIT" }, { status: 409 });
  }

  if (action === "CANCEL") {
    const updated = await prisma.borrowRequest.update({
      where: { borrow_request_id: id },
      data: { borrow_request_status: "CANCELLED" },
      include: {
        assignments: {
          orderBy: { borrow_assigned_at: "desc" },
          include: {
            consultant: { include: { profile: true } },
            consultantUniversity: true,
          },
        },
        fromUniversity: true,
      },
    });

    return NextResponse.json({ ok: true, data: toBorrowRequestDetailDTO(updated) });
  }

  // UPDATE: รองรับทั้ง body แบบเก่า (title/reason/neededFrom...) และแบบใหม่ (borrow_request_title/borrow_needed_from...)
  const title = body.borrow_request_title ?? body.title;
  const reason = body.borrow_request_reason ?? body.reason;
  const detail = body.borrow_request_detail ?? body.detail;

  const neededFrom = body.borrow_needed_from ?? body.neededFrom;
  const neededTo = body.borrow_needed_to ?? body.neededTo;
  const neededCount = body.borrow_needed_count ?? body.neededCount;

  const updated = await prisma.borrowRequest.update({
    where: { borrow_request_id: id },
    data: {
      borrow_request_title: title ?? undefined,
      borrow_request_reason: reason ?? undefined,
      borrow_request_detail: detail ?? undefined,

      borrow_needed_from: neededFrom ? new Date(neededFrom) : undefined,
      borrow_needed_to: neededTo ? new Date(neededTo) : undefined,
      borrow_needed_count: neededCount ?? undefined,
    },
    include: {
      assignments: {
        orderBy: { borrow_assigned_at: "desc" },
        include: {
          consultant: { include: { profile: true } },
          consultantUniversity: true,
        },
      },
      fromUniversity: true,
    },
  });

  return NextResponse.json({ ok: true, data: toBorrowRequestDetailDTO(updated) });
}
