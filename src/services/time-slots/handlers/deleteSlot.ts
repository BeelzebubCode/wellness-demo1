// src/services/timeSlots/deleteSlot.ts
import prisma from "@/lib/prisma";

export async function deleteTimeSlot(slotId: number, universityId: number) {
  const slot = await prisma.timeSlot.findUnique({
    where: { time_slot_id: slotId },
    select: { time_slot_id: true, university_id: true },
  });

  if (!slot) return { ok: false as const, status: 404, error: "Slot not found" };
  if (slot.university_id !== universityId) return { ok: false as const, status: 403, error: "Permission denied" };

  const hasBooking = await prisma.booking.findFirst({
    where: { time_slot_id: slotId },
    select: { booking_id: true },
  });

  if (hasBooking) return { ok: false as const, status: 400, error: "Cannot delete slot with bookings" };

  await prisma.timeSlot.delete({ where: { time_slot_id: slotId } });
  return { ok: true as const };
}
