// src/app/api/v2/bookings/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth/context";
import { requireAuth } from "@/lib/auth/guard";
import { handleAssignBooking } from "@/services/booking/handlers/assignBooking";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAccountFromRequest(req);
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const body = await req.json().catch(() => ({} as any));
    return handleAssignBooking(ctx!, params.id, body);
  } catch (err) {
    console.error("[PATCH /api/v2/bookings/:id/assign]", err);
    return NextResponse.json({ error: "Failed to assign booking" }, { status: 500 });
  }
}
