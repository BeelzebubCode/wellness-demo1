// src/app/api/v2/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleGetBooking } from "@/services/booking/handlers/getBooking";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // (เลือกใส่ตาม policy)
    assertRole(account.role, [
      "STUDENT",
      "CONSULTANT",
      "HEAD_CONSULTANT",
      "SUPER_ADMIN",
      "RECTOR",
    ]);

    return await handleGetBooking(
      { ...(account as any), activeUniversityId },
      params.id,
    );
  } catch (err: any) {
    console.error("[GET /api/v2/bookings/:id]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch booking" },
      { status: err?.status ?? 500 },
    );
  }
}
