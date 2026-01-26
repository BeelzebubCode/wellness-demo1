import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleGetConsultant } from "@/services/consultant/handlers/getConsultant";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["HEAD_CONSULTANT", "RECTOR", "SUPER_ADMIN"]);

    const ctx = { ...account, activeUniversityId } as any;
    return handleGetConsultant(ctx, params.id);
  } catch (err: any) {
    console.error("[GET /api/v2/consultants/:id]", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: err?.status ?? 500 });
  }
}
