import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleListConsultants } from "@/services/consultant/handlers/listConsultants";

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["HEAD_CONSULTANT", "RECTOR", "SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const orgIdRaw = searchParams.get("organizationId");
    const organizationId = orgIdRaw ? Number(orgIdRaw) : null;

    // ✅ ส่ง ctx ให้ handler
    const ctx = { ...account, activeUniversityId } as any;
    return handleListConsultants(ctx, {
      organizationId: Number.isFinite(organizationId as any) ? organizationId : null,
    });
  } catch (err: any) {
    console.error("[GET /api/v2/consultants]", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: err?.status ?? 500 });
  }
}
