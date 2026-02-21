// src/app/api/v2/borrow-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { createBorrowRequest } from "@/services/borrow-requests/handlers/createBorrowRequest";
import { listMyBorrowRequests } from "@/services/borrow-requests/handlers/listMyBorrowRequests";
import { getAccountId } from "@/services/borrow-requests/helpers";

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["HEAD_CONSULTANT", "COUNSELING_ADMIN"]);

    // ✅ debug ชัด ๆ
    const accountId = getAccountId(account);

    if (!activeUniversityId) {
      return NextResponse.json(
        { ok: false, error: "NO_ACTIVE_UNIVERSITY", meta: { accountId, role: account.role } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const q = searchParams.get("q") || undefined;

    const rows = await listMyBorrowRequests({
      accountId,
      universityId: activeUniversityId,
      status,
      q,
    });

    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    // ✅ ใส่ meta/stack เพื่อรู้สาเหตุจริง
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "Unknown error",
        name: e?.name,
        code: e?.code,
        meta: e,
      },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    assertRole(account.role, ["HEAD_CONSULTANT", "COUNSELING_ADMIN"]);

    const body = await req.json();
    const created = await createBorrowRequest({
      activeUniversityId,
      accountId: getAccountId(account),
      body,
    });

    // ✅ FE ต้องการ ok
    return NextResponse.json({ ok: true, data: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
