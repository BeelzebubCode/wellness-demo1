// src/app/api/v2/time-slots/regenerate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { TIME_SLOT_STAFF_ROLES } from "@/services/time-slots/handlers/constants";
import { isValidDateStr } from "@/services/time-slots/handlers/utils";
import { regenerateSlotsByDate } from "@/services/time-slots/handlers/regenerateByDate";

export async function PATCH(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, [...TIME_SLOT_STAFF_ROLES]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    if (!isValidDateStr(dateStr)) {
      return NextResponse.json({ success: false, error: "Invalid date format/value. Use YYYY-MM-DD" }, { status: 400 });
    }

    const result = await regenerateSlotsByDate(dateStr, activeUniversityId);
    return NextResponse.json({ success: true, date: dateStr, universityId: activeUniversityId, ...result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "Failed to regenerate" }, { status: e?.status ?? 500 });
  }
}
