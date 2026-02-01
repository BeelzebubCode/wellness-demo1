// src/app/api/v2/bookings/[id]/assign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import type { AccountContext } from "@/lib/auth/context";
import { handleAssignBooking } from "@/services/booking/handlers/assignBooking";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // ✅ ต้องเป็นหัวหน้าที่แจกงาน
    assertRole(account.role, ["HEAD_CONSULTANT"]);

    const bookingId = Number(params.id);
    if (!Number.isFinite(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      consultantId?: number;
      note?: string;
    };

    // ✅ สร้าง ctx ให้ handler ใช้ (handler จะ tenant-check + resolve consultantId ให้เอง)
    const ctx: AccountContext & { activeUniversityId?: number } = {
      accountId: account.accountId,
      username:
        (account as any)?.username ??
        (account as any)?.account_username ??
        "",
      role: account.role,

      // ถ้า guard ของคุณใช้ allowedUniversityIds ก็ใส่ไป
      allowedUniversityIds: [activeUniversityId],

      // ✅ สำคัญ: ส่ง activeUniversityId ให้ handler
      activeUniversityId,
      // ✅ ไม่จำเป็นต้องใส่ consultantId ที่นี่ก็ได้
      // handler จะ resolve จาก accountId+activeUniversityId เอง
    } as any;

    return await handleAssignBooking(ctx, String(bookingId), body);
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
