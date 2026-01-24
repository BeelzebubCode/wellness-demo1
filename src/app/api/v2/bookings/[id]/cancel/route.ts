// src/app/api/v2/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import { handleCancelBooking } from "@/services/booking/handlers/cancelBooking";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req); // ✅ v2 tenant context
    const body = await req.json().catch(() => ({} as any));

    const result = await handleCancelBooking({
      tenant,
      bookingIdRaw: params.id,
      body,
    });

    return NextResponse.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[PATCH /api/v2/bookings/:id/cancel]", e);

    const status = e?.status ?? 500;
    const message =
      status === 401 ? "Unauthorized" : status === 403 ? "Permission denied" : e?.message ?? "Failed to cancel booking";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
