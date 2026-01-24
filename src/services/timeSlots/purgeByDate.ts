// src/services/timeSlots/purgeByDate.ts
import prisma from "@/lib/prisma";
import { getDayRangeBangkok } from "./utils";

export async function purgeUnusedSlotsByDate(dateStr: string, universityId: number) {
  const { start: startOfDay, end: endOfDay } = getDayRangeBangkok(dateStr);

  const slotIds = await prisma.timeSlot.findMany({
    where: {
      university_id: universityId,
      time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
    },
    select: { time_slot_id: true },
  });

  const ids = slotIds.map((x) => x.time_slot_id);
  if (ids.length === 0) return { deleted: 0 };

  const used = await prisma.booking.findMany({
    where: { time_slot_id: { in: ids } },
    select: { time_slot_id: true },
    distinct: ["time_slot_id"],
  });

  const usedSet = new Set(used.map((u) => u.time_slot_id));
  const deletableIds = ids.filter((id) => !usedSet.has(id));

  const deleted = await prisma.timeSlot.deleteMany({
    where: { time_slot_id: { in: deletableIds } },
  });

  return { deleted: deleted.count };
}
