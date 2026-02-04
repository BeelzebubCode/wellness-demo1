// src/app/api/v2/bookings/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleCompleteBooking } from "@/services/booking/handlers/completeBooking";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // ✅ ให้ตรง handler
    assertRole(account.role, ["CONSULTANT"]);

    const body = await req.json().catch(() => ({} as any));

    return await handleCompleteBooking(
      { ...(account as any), activeUniversityId },
      params.id,
      body,
    );
  } catch (err: any) {
    console.error("[PATCH /api/v2/bookings/:id/complete]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to complete booking" },
      { status: err?.status ?? 500 },
    );
  }
}
