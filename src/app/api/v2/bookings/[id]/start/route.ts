// src/app/api/v2/bookings/[id]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth/context";
import { requireAuth } from "@/lib/auth/guard";
import { handleStartBooking } from "@/services/booking/handlers/startBooking";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAccountFromRequest(req);
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    return handleStartBooking(ctx!, params.id);
  } catch (err) {
    console.error("[PATCH /api/v2/bookings/:id/start]", err);
    return NextResponse.json({ error: "Failed to start booking" }, { status: 500 });
  }
}
