// src/app/api/v2/bookings/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleAssignBooking } from "@/services/booking/handlers/assignBooking";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    assertRole(account.role, ["HEAD_CONSULTANT"]);

    const body = (await req.json().catch(() => ({}))) as {
      consultantId?: number;
      note?: string;
      borrowAssignmentId?: number;
    };

    return await handleAssignBooking(
      {
        accountId: account.accountId,
        role: account.role,
        activeUniversityId,
      },
      params.id,
      body,
    );
  } catch (e: any) {
    console.error("[V2_ASSIGN_BOOKING_POST]", e);

    const status = e?.status ?? 500;
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Permission denied"
        : e?.message ?? "Failed to assign booking";

    return NextResponse.json({ error: message }, { status });
  }
}
