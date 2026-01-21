// src/app/api/v1/time-slots/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { BookingStatus, TimeSlotStatus, AccountRole } from "@prisma/client";

type PatchBody = {
  capacity?: number;
  isAvailable?: boolean;
  status?: "AVAILABLE" | "LOCKED" | "CANCELLED" | "BOOKED";
};

function allowedUniversitySet(payload: any) {
  const arr: number[] = Array.isArray(payload?.allowedUniversityIds)
    ? payload.allowedUniversityIds
    : [];
  const home = typeof payload?.homeUniversityId === "number" ? payload.homeUniversityId : null;

  return new Set<number>([...(home ? [home] : []), ...arr]);
}

function isSlotAdmin(role: AccountRole) {
  // ปรับได้ตามระบบคุณ
  return role === "HEAD_CONSULTANT" || role === "SUPER_ADMIN" || role === "RECTOR";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getAuth(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const role = payload.role as AccountRole;
    if (!isSlotAdmin(role)) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const slotId = Number(params.id);
    if (Number.isNaN(slotId)) {
      return NextResponse.json({ success: false, error: "Invalid slot id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({} as PatchBody))) as PatchBody;

    // ✅ โหลด slot ก่อนเพื่อเช็ค tenant + ใช้ค่าปัจจุบัน
    const slot = await prisma.timeSlot.findUnique({
      where: { time_slot_id: slotId },
      select: {
        time_slot_id: true,
        university_id: true,
        time_slot_max_capacity: true,
        time_slot_status: true,
      },
    });

    if (!slot) {
      return NextResponse.json({ success: false, error: "Slot not found" }, { status: 404 });
    }

    // ✅ tenant guard
    const uniSet = allowedUniversitySet(payload);
    if (!uniSet.has(slot.university_id)) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    // ✅ นับ booking ที่ active ใน slot นี้
    const activeCount = await prisma.booking.count({
      where: {
        time_slot_id: slotId,
        booking_status: { not: BookingStatus.CANCELLED },
      },
    });

    const data: Record<string, any> = {};

    // capacity
    if (typeof body.capacity === "number") {
      if (body.capacity <= 0) {
        return NextResponse.json({ success: false, error: "capacity must be > 0" }, { status: 400 });
      }

      // ห้ามลดต่ำกว่าจำนวน booking ที่ยัง active อยู่
      if (body.capacity < activeCount) {
        return NextResponse.json(
          { success: false, error: `capacity ต่ำเกินไป (มี booking ใช้อยู่ ${activeCount})` },
          { status: 400 }
        );
      }

      data.time_slot_max_capacity = body.capacity;
    }

    // isAvailable shortcut
    if (typeof body.isAvailable === "boolean") {
      data.time_slot_status = body.isAvailable ? TimeSlotStatus.AVAILABLE : TimeSlotStatus.LOCKED;
    }

    // explicit status
    if (typeof body.status === "string") {
      data.time_slot_status = body.status as TimeSlotStatus;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 });
    }

    // ✅ ปรับสถานะอัตโนมัติให้ไม่ขัดกับ capacity
    // ถ้ามี booking active ถึง/เกิน capacity -> ต้อง BOOKED
    const nextCapacity =
      typeof data.time_slot_max_capacity === "number" ? data.time_slot_max_capacity : slot.time_slot_max_capacity;

    const requestedStatus = data.time_slot_status as TimeSlotStatus | undefined;

    if (requestedStatus && requestedStatus === TimeSlotStatus.AVAILABLE) {
      if (activeCount >= nextCapacity) {
        data.time_slot_status = TimeSlotStatus.BOOKED;
      }
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getAuth(_req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const role = payload.role as AccountRole;
    if (!isSlotAdmin(role)) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const slotId = Number(params.id);
    if (Number.isNaN(slotId)) {
      return NextResponse.json({ success: false, error: "Invalid slot id" }, { status: 400 });
    }

    // ✅ เช็ค slot + tenant
    const slot = await prisma.timeSlot.findUnique({
      where: { time_slot_id: slotId },
      select: { time_slot_id: true, university_id: true },
    });

    if (!slot) {
      return NextResponse.json({ success: false, error: "Slot not found" }, { status: 404 });
    }

    const uniSet = allowedUniversitySet(payload);
    if (!uniSet.has(slot.university_id)) {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    // ✅ ห้ามลบถ้ามี booking ผูกอยู่
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
