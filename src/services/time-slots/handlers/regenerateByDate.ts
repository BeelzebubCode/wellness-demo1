// src/services/timeSlots/regenerateByDate.ts
import prisma from "@/lib/prisma";
import { getDayRangeBangkok } from "./utils";
import { purgeUnusedSlotsByDate } from "./purgeByDate";
import { generateDefaultSlotsForUniversity } from "./generateDefault";

export async function regenerateSlotsByDate(dateStr: string, universityId: number) {
  const { start: startOfDay, end: endOfDay } = getDayRangeBangkok(dateStr);

  const purged = await purgeUnusedSlotsByDate(dateStr, universityId);
  const created = await generateDefaultSlotsForUniversity(dateStr, universityId);

  const total = await prisma.timeSlot.count({
    where: {
      university_id: universityId,
      time_slot_start_datetime: { gte: startOfDay, lte: endOfDay },
    },
  });

  return { deleted: purged.deleted, created, total };
}
