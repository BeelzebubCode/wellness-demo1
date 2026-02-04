// src/app/api/v2/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import { handleCancelBooking } from "@/services/booking/handlers/cancelBooking";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const tenant = await requireTenant(req);
    const body = await req.json().catch(() => ({} as any));

    // ✅ handleCancelBooking คืน NextResponse อยู่แล้ว → return ตรงๆ
    return await handleCancelBooking({
      tenant,
      bookingIdRaw: params.id,
      body,
    });
  } catch (e: any) {
    console.error("[PATCH /api/v2/bookings/:id/cancel]", e);

    const status = e?.status ?? 500;
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Permission denied"
        : e?.message ?? "Failed to cancel booking";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

