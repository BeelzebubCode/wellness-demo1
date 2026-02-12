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

  const PAST_DAYS = 365; // ✅ 1 Year History
  const FUTURE_DAYS = 14;
  const TOTAL_DAYS = PAST_DAYS + FUTURE_DAYS;

  const SLOT_DURATION_MINUTES = 60;
  const DEFAULT_CAPACITY = 4;

  // ------------------------------
  // helpers
  // ------------------------------
  function isWeekend(date: Date) {
    const day = date.getUTCDay();
    return day === 0 || day === 6;
  }

  function buildSlotsForDate(date: Date) {
    const openHour = 8;
    const closeHour = isWeekend(date) ? 17 : 21;

    const slots: Array<{ start: Date; end: Date }> = [];

    for (let hour = openHour; hour < closeHour; hour++) {
      // Use toThaiDate to get the correct UTC instant for 08:00 TH
      const start = toThaiDate(date, hour, 0);
      if (hour === 0 || hour === 8) {
         console.log(`[DEBUG] Date: ${date.toISOString()}, Hour: ${hour}, StartUTC: ${start.toISOString()}`);
      }

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES);

      // No need to check closeHour logic again if loop bound is correct
      // But let's keep it safe in case of overflow

      slots.push({ start, end });
    }

    return slots;
  }

  // ------------------------------
  // main loop
  // ------------------------------
  for (const uni of universities) {
    const createBuffer: Omit<TimeSlot, "time_slot_id">[] = [];

    const startDate = addDays(today0, -PAST_DAYS);

    for (let i = 0; i <= TOTAL_DAYS; i++) {
      const distinctDate = addDays(startDate, i);
      
      // Normalize to UTC Noon to avoid timezone shifting during setUTCHours (Date Shifting Bug Fix)
      const d = new Date(Date.UTC(distinctDate.getFullYear(), distinctDate.getMonth(), distinctDate.getDate(), 12, 0, 0));

      const slots = buildSlotsForDate(d);
      for (const s of slots) {
        createBuffer.push({
          university_id: uni.university_id,
          time_slot_start_datetime: s.start,
          time_slot_end_datetime: s.end,
          time_slot_max_capacity: DEFAULT_CAPACITY,
          time_slot_status: TimeSlotStatus.OPEN,
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
