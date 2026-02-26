// prisma/seeds/08-timeslots.ts
import { PrismaClient, TimeSlotStatus, TimeSlot } from "@prisma/client";
import { startOfDay, addDays } from "../seed-utils/date";
import { toThaiDate } from "../seed-utils/timezone";

export async function seedTimeSlots(
  prisma: PrismaClient,
  args: { universities: { university_id: number }[] },
) {
  console.log("⏰ Creating time slots (university pool, with past 3 months)...");

  const { universities } = args;

  const today0 = startOfDay(new Date());

  const timeSlotsByUniId = new Map<number, TimeSlot[]>();

  const PAST_DAYS = 2555; // ✅ 7 Years History
  const FUTURE_DAYS = 14;
  const TOTAL_DAYS = PAST_DAYS + FUTURE_DAYS;

  const SLOT_DURATION_MINUTES = 60;
  const DEFAULT_CAPACITY = 4;

  // ------------------------------
  // helpers
  // ------------------------------
  function getDayPeriodCode(hour: number): string {
    if (hour >= 8 && hour < 12) return "MORNING";
    if (hour >= 12 && hour < 16) return "AFTERNOON";
    if (hour >= 16 && hour < 20) return "EVENING";
    return "EVENING"; // Fallback
  }

  function buildSlotsForDate(date: Date, dayPeriodMap: Map<string, number>) {
    const openHour = 8;
    const closeHour = 20;

    const slots: Array<{ start: Date; end: Date; dayPeriodId: number | null }> = [];

    for (let hour = openHour; hour < closeHour; hour++) {
      const start = toThaiDate(date, hour, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES);

      const code = getDayPeriodCode(hour);
      const dayPeriodId = dayPeriodMap.get(code) ?? null;

      slots.push({ start, end, dayPeriodId });
    }

    return slots;
  }

  // ------------------------------
  // main loop
  // ------------------------------
  for (const uni of universities) {
    // Pre-fetch day periods for this university
    const periods = await prisma.dayPeriod.findMany({
      where: { university_id: uni.university_id }
    });
    const dayPeriodMap = new Map<string, number>();
    for (const p of periods) {
      dayPeriodMap.set(p.day_period_code, p.day_period_id);
    }

    const createBuffer: Omit<TimeSlot, "time_slot_id">[] = [];

    const startDate = addDays(today0, -PAST_DAYS);

    for (let i = 0; i <= TOTAL_DAYS; i++) {
      const distinctDate = addDays(startDate, i);

      const d = new Date(Date.UTC(distinctDate.getFullYear(), distinctDate.getMonth(), distinctDate.getDate(), 12, 0, 0));

      const slots = buildSlotsForDate(d, dayPeriodMap);
      for (const s of slots) {
        createBuffer.push({
          university_id: uni.university_id,
          time_slot_start_datetime: s.start,
          time_slot_end_datetime: s.end,
          time_slot_max_capacity: DEFAULT_CAPACITY,
          time_slot_status: TimeSlotStatus.OPEN,
          day_period_id: s.dayPeriodId,
        });
      }
    }

    // batch insert (rerun-safe)
    await prisma.timeSlot.createMany({
      data: createBuffer,
      skipDuplicates: true,
    });

    // load back slots สำหรับ booking seed
    const slots = await prisma.timeSlot.findMany({
      where: {
        university_id: uni.university_id,
        time_slot_start_datetime: { gte: startDate },
      },
      orderBy: { time_slot_start_datetime: "asc" },
    });

    timeSlotsByUniId.set(uni.university_id, slots);
  }

  const totalTimeSlots = Array.from(timeSlotsByUniId.values()).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return { timeSlotsByUniId, totalTimeSlots };
}
