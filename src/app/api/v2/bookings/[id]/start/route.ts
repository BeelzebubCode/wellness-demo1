// src/app/api/v2/bookings/[id]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleStartBooking } from "@/services/booking/handlers/startBooking";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // ✅ รับเคส = consultant เท่านั้น (ให้ตรง handler)
    assertRole(account.role, ["CONSULTANT"]);

    return await handleStartBooking(
      { ...(account as any), activeUniversityId },
      params.id,
    );
  } catch (err: any) {
    console.error("[PATCH /api/v2/bookings/:id/start]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to start booking" },
      { status: err?.status ?? 500 },
    );
  }
}
