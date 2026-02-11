// src/app/api/v2/bookings/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { getMyBookings } from "@/services/booking/handlers/getMyBookings";

const ALLOWED = ["STUDENT", "CONSULTANT", "HEAD_CONSULTANT"] as const;
type AllowedRole = (typeof ALLOWED)[number];

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    assertRole(account.role, ALLOWED);
    const role = account.role as AllowedRole;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const statusGroup = (searchParams.get("statusGroup") as any) ?? "ALL";

    const { items, total } = await getMyBookings({
      accountId: account.accountId,
      activeUniversityId,
      role,
      page,
      limit,
      statusGroup,
    });

    return NextResponse.json({
      success: true,
      universityId: activeUniversityId,

      // New standardized pagination fields
      items,
      total,
      page,
      limit,
      
      // Backward compatibility fields (deprecated)
      bookings: items, 
    });
  } catch (e: any) {
    console.error("[BOOKINGS_MY_V2_GET]", {
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
      stack: e?.stack,
      status: e?.status,
    });

    const status = e?.status ?? 500;
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Permission denied"
        : e?.message ?? "Failed to load bookings";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
