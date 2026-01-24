// src/app/api/v2/time-slots/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { TIME_SLOT_STAFF_ROLES } from "@/services/timeSlots/constants";
import { updateTimeSlot } from "@/services/timeSlots/updateSlot";
import type { PatchSlotBody } from "@/services/timeSlots/updateSlot";
import { deleteTimeSlot } from "@/services/timeSlots/deleteSlot";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(String(account.role).toUpperCase(), [...TIME_SLOT_STAFF_ROLES]);

    const slotId = Number(params.id);
    if (!Number.isFinite(slotId) || slotId <= 0) {
      return NextResponse.json({ success: false, error: "Invalid slot id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as PatchSlotBody;
    const result = await updateTimeSlot(slotId, activeUniversityId, body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, slot: result.slot });
  } catch (e: any) {
    const status = e?.status ?? 500;
    const msg =
      status === 401 ? "Unauthorized" :
      status === 403 ? "Permission denied" :
      e?.message ?? "Failed to update time slot";

    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(String(account.role).toUpperCase(), [...TIME_SLOT_STAFF_ROLES]);

    const slotId = Number(params.id);
    if (!Number.isFinite(slotId) || slotId <= 0) {
      return NextResponse.json({ success: false, error: "Invalid slot id" }, { status: 400 });
    }

    const result = await deleteTimeSlot(slotId, activeUniversityId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    const msg =
      status === 401 ? "Unauthorized" :
      status === 403 ? "Permission denied" :
      e?.message ?? "Failed to delete time slot";

    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
