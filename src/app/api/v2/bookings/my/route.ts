// src/app/api/v2/bookings/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { getMyBookings } from "@/services/booking/handlers/getMyBookings";

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    const bookings = await getMyBookings({
      accountId: account.accountId,
      activeUniversityId,
    });

    return NextResponse.json({
      success: true,
      universityId: activeUniversityId,
      bookings,
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
