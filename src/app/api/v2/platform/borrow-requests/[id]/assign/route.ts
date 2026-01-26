import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { platformAssignBorrowRequest } from "@/services/borrowRequests";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { accountId, role } = await requireTenant(req);
  assertRole(role, ["SUPER_ADMIN"]);

  const id = Number(ctx.params.id);
  const body = await req.json().catch(() => ({}));

  const data = await platformAssignBorrowRequest({
    borrowRequestId: id,
    assignedByAccountId: accountId,
    consultantId: Number(body.consultantId),
    consultantUniversityId: Number(body.consultantUniversityId),
    startAt: body.startAt,
    endAt: body.endAt,
    note: body.note,
    // ถ้าจะให้ยืมหลายคนในครั้งเดียว: เปลี่ยน body เป็น array แล้ว loop create
  });

  return NextResponse.json({ ok: true, data });
}
