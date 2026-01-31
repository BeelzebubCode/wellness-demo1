// src/services/timeSlots/updateSlot.ts
import prisma from "@/lib/prisma";
import { BookingStatus, TimeSlotStatus } from "@prisma/client";

export type PatchSlotBody = {
  capacity?: number;
  isAvailable?: boolean;
  status?: "OPEN" | "CLOSED" | "CANCELLED" | "FULL";
};

export async function updateTimeSlot(
  slotId: number,
  universityId: number,
  body: PatchSlotBody,
) {
  const slot = await prisma.timeSlot.findUnique({
    where: { time_slot_id: slotId },
    select: {
      time_slot_id: true,
      university_id: true,
      time_slot_max_capacity: true,
      time_slot_status: true,
    },
  });

  if (!slot)
    return { ok: false as const, status: 404, error: "Slot not found" };
  if (slot.university_id !== universityId)
    return { ok: false as const, status: 403, error: "Permission denied" };

  const activeCount = await prisma.booking.count({
    where: {
      time_slot_id: slotId,
      booking_status: { not: BookingStatus.CANCELLED },
    },
  });

  const data: Record<string, any> = {};

  if (typeof body.capacity === "number") {
    if (body.capacity <= 0)
      return { ok: false as const, status: 400, error: "capacity must be > 0" };
    if (body.capacity < activeCount) {
      return {
        ok: false as const,
        status: 400,
        error: `capacity ต่ำเกินไป (มี booking ใช้อยู่ ${activeCount})`,
      };
    }
    data.time_slot_max_capacity = body.capacity;
  }

  if (typeof body.isAvailable === "boolean") {
    data.time_slot_status = body.isAvailable
      ? TimeSlotStatus.OPEN
      : TimeSlotStatus.CLOSED;
  }

  if (typeof body.status === "string") {
    data.time_slot_status = body.status as TimeSlotStatus;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false as const, status: 400, error: "No updates provided" };
  }

  const nextCapacity =
    typeof data.time_slot_max_capacity === "number"
      ? data.time_slot_max_capacity
      : slot.time_slot_max_capacity;

  const requestedStatus = data.time_slot_status as TimeSlotStatus | undefined;
  if (requestedStatus === TimeSlotStatus.OPEN && activeCount >= nextCapacity) {
    data.time_slot_status = TimeSlotStatus.FULL;
  }

  const updated = await prisma.timeSlot.update({
    where: { time_slot_id: slotId },
    data,
  });

  return { ok: true as const, slot: updated };
}
