// src/services/timeSlots/generateDefault.ts
import prisma from "@/lib/prisma";
import { buildSlotRanges } from "./templates";
import { TimeSlotStatus } from "@prisma/client";

export async function generateDefaultSlotsForUniversity(dateStr: string, universityId: number) {
  const ranges = buildSlotRanges(dateStr);
  if (ranges.length === 0) return 0;

  const DEFAULT_CAPACITY = 2;

  const data = ranges.map((r) => ({
    university_id: universityId,
    time_slot_start_datetime: r.start,
    time_slot_end_datetime: r.end,
    time_slot_max_capacity: DEFAULT_CAPACITY,
    time_slot_status: TimeSlotStatus.AVAILABLE,
  }));

  const result = await prisma.timeSlot.createMany({
    data,
    skipDuplicates: true, // relies on @@unique([university_id, start, end])
  });

  return result.count;
}
