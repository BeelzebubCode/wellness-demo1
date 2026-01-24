// src/app/api/v2/bookings/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { getMyBookings } from "@/services/booking/handlers/getMyBookings";

const ALLOWED = ["STUDENT", "CONSULTANT", "HEAD_CONSULTANT"] as const;
type AllowedRole = (typeof ALLOWED)[number];

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // ✅ กัน role อื่นออก และยังคุม runtime เหมือนเดิม
    assertRole(account.role, ALLOWED);

    // ✅ TS ไม่รู้ว่า assertRole narrow ให้แล้ว → ใช้ cast หลัง assert
    const role = account.role as AllowedRole;

    const bookings = await getMyBookings({
      accountId: account.accountId,
      activeUniversityId,
      role,
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
