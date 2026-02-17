// src/services/timeSlots/generateDefault.ts
import prisma from "@/lib/prisma";
import { buildSlotRanges } from "./templates";
import { TimeSlotStatus } from "@prisma/client";

export async function generateDefaultSlotsForUniversity(dateStr: string, universityId: number) {
  const ranges = buildSlotRanges(dateStr);
  if (ranges.length === 0) return 0;

  // Pre-fetch day periods for this university
  const periods = await prisma.dayPeriod.findMany({
    where: { university_id: universityId, is_active: true }
  });
  
  const periodMap = new Map<string, number>();
  for (const p of periods) {
    periodMap.set(p.day_period_code, p.day_period_id);
  }

  function getDayPeriodCode(hour: number): string {
    if (hour >= 8 && hour < 12) return "MORNING";
    if (hour >= 12 && hour < 16) return "AFTERNOON";
    if (hour >= 16 && hour < 20) return "EVENING";
    return "EVENING";
  }

  const DEFAULT_CAPACITY = 2;

  const data = ranges.map((r) => {
    // start time in Thai timezone for matching
    // Actually, it's better to use more robust logic if possible, 
    // but the seed used a similar hour-based check.
    
    // Safer way: r.start is in UTC. In Bangkok it's r.start + 7 hours.
    // If we want the local hour:
    const localHour = (r.start.getUTCHours() + 7) % 24;
    
    const code = getDayPeriodCode(localHour);
    const dayPeriodId = periodMap.get(code) ?? null;

    return {
      university_id: universityId,
      time_slot_start_datetime: r.start,
      time_slot_end_datetime: r.end,
      time_slot_max_capacity: DEFAULT_CAPACITY,
      time_slot_status: TimeSlotStatus.OPEN,
      day_period_id: dayPeriodId,
    };
  });

  const result = await prisma.timeSlot.createMany({
    data,
    skipDuplicates: true, // relies on @@unique([university_id, start, end])
  });

  return result.count;
}
