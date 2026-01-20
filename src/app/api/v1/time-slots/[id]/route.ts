// src/app/api/v1/time-slots/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type PatchBody = {
  capacity?: number;
  isAvailable?: boolean;
  status?: "AVAILABLE" | "LOCKED" | "CANCELLED" | "BOOKED";
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slotId = Number(params.id);
    if (Number.isNaN(slotId)) {
      return NextResponse.json({ success: false, error: "Invalid slot id" }, { status: 400 });
    }

    const body = (await req.json()) as PatchBody;

    const data: Record<string, any> = {};

    if (typeof body.capacity === "number") {
      if (body.capacity <= 0) {
        return NextResponse.json({ success: false, error: "capacity must be > 0" }, { status: 400 });
      }
      data.time_slot_max_capacity = body.capacity;
    }

    if (typeof body.isAvailable === "boolean") {
      data.time_slot_status = body.isAvailable ? "AVAILABLE" : "LOCKED";
    }

    if (typeof body.status === "string") {
      data.time_slot_status = body.status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 });
    }

    const updated = await prisma.timeSlot.update({
      where: { time_slot_id: slotId },
      data,
    });

    return NextResponse.json({ success: true, slot: updated });
  } catch (error) {
    console.error("PATCH time-slot error:", error);
    return NextResponse.json({ success: false, error: "Failed to update time slot" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slotId = Number(params.id);
    if (Number.isNaN(slotId)) {
      return NextResponse.json({ success: false, error: "Invalid slot id" }, { status: 400 });
    }

    // ✅ schema ใหม่: เช็ค booking ที่ผูก time_slot_id ตรง ๆ
    const hasBooking = await prisma.booking.findFirst({
      where: { time_slot_id: slotId },
      select: { booking_id: true },
    });

    if (hasBooking) {
      return NextResponse.json(
        { success: false, error: "Cannot delete slot with bookings" },
        { status: 400 }
      );
    }

    await prisma.timeSlot.delete({ where: { time_slot_id: slotId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE time-slot error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete time slot" }, { status: 500 });
  }
}
