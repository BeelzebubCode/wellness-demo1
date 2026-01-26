// src/app/api/v2/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { BookingStatus } from "@prisma/client";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleListBookings } from "@/services/booking/handlers/listBookings";

export async function GET(request: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(request);

    assertRole(account.role, [
      "STUDENT",
      "CONSULTANT",
      "HEAD_CONSULTANT",
      "SUPER_ADMIN",
      "RECTOR",
    ]);

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as BookingStatus | null;
    const studentUsername = searchParams.get("student");
    const consultantIdRaw = searchParams.get("consultantId");
    const date = searchParams.get("date"); // yyyy-mm-dd

    const consultantId = consultantIdRaw ? Number(consultantIdRaw) : null;

    // ✅ ส่ง ctx + activeUniversityId เข้า service
    return await handleListBookings(
      { ...(account as any), activeUniversityId },
      {
        status,
        studentUsername,
        consultantId: Number.isFinite(consultantId as any) ? consultantId : null,
        date,
      },
    );
  } catch (err: any) {
    console.error("[GET /api/v2/bookings]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch bookings" },
      { status: err?.status ?? 500 },
    );
  }
}
