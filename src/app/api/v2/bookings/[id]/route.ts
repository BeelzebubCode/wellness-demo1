// src/app/api/v2/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth/context";
import { requireAuth } from "@/lib/auth/guard";
import { handleGetBooking } from "@/services/booking/handlers/getBooking";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAccountFromRequest(req);
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    return handleGetBooking(ctx!, params.id);
  } catch (err) {
    console.error("[GET /api/v2/bookings/:id]", err);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}
