// src/app/api/v2/bookings/[id]/online-channel/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth/context";
import { requireAuth } from "@/lib/auth/guard";
import { handleSetOnlineChannel } from "@/services/booking/handlers/setOnlineChannel";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAccountFromRequest(req);
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const body = await req.json().catch(() => ({}));
    return handleSetOnlineChannel(ctx as any, params.id, body);
  } catch (err) {
    console.error("[PATCH /api/v2/bookings/:id/online-channel]", err);
    return NextResponse.json({ error: "Failed to set online channel" }, { status: 500 });
  }
}
