// src/app/api/v2/time-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { TIME_SLOT_VIEW_ROLES } from "@/services/time-slots/handlers/constants";
import { isValidDateStr } from "@/services/time-slots/handlers/utils";
import { listTimeSlotsByDate } from "@/services/time-slots/handlers/listByDate";
import { generateDefaultSlotsForUniversity } from "@/services/time-slots/handlers/generateDefault";
import { createTimeSlot } from "@/services/time-slots/handlers/createSlot";
import type { CreateSlotBody } from "@/services/time-slots/handlers/createSlot";

const AUTO_GENERATE_IF_EMPTY = true;

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, [...TIME_SLOT_VIEW_ROLES]);

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) return NextResponse.json({ success: false, error: "Date is required (YYYY-MM-DD)" }, { status: 400 });
    if (!isValidDateStr(dateStr)) {
      return NextResponse.json({ success: false, error: "Invalid date format/value. Use YYYY-MM-DD" }, { status: 400 });
    }

    let slots = await listTimeSlotsByDate(dateStr, activeUniversityId);

    if (AUTO_GENERATE_IF_EMPTY && slots.length === 0) {
      await generateDefaultSlotsForUniversity(dateStr, activeUniversityId);
      slots = await listTimeSlotsByDate(dateStr, activeUniversityId);
    }

    const res = NextResponse.json({ success: true, date: dateStr, universityId: activeUniversityId, slots });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ success: false, error: e?.message ?? "Failed to fetch time slots" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    // Use STAFF roles for creation (Head Consultant/Admin)
    assertRole(String(account.role).toUpperCase(), ["HEAD_CONSULTANT", "ADMIN", "SUPER_ADMIN"]);

    const body = (await req.json().catch(() => ({}))) as CreateSlotBody;

    const result = await createTimeSlot(activeUniversityId, body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, slot: result.slot });
  } catch (e: any) {
    const status = e?.status ?? 500;
    const msg =
      status === 401 ? "Unauthorized" :
        status === 403 ? "Permission denied" :
          e?.message ?? "Failed to create time slot";

    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
