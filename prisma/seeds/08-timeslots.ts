// prisma/seeds/08-timeslots.ts
import { PrismaClient, TimeSlotStatus, TimeSlot } from "@prisma/client";
import { startOfDay, addDays } from "../seed-utils/date";

export async function seedTimeSlots(
  prisma: PrismaClient,
  args: { universities: { university_id: number }[] },
) {
  console.log("⏰ Creating time slots (university pool, with past 3 months)...");

  const { universities } = args;

  const today0 = startOfDay(new Date());

  const timeSlotsByUniId = new Map<number, TimeSlot[]>();

  const PAST_DAYS = 90;
  const FUTURE_DAYS = 14;
  const TOTAL_DAYS = PAST_DAYS + FUTURE_DAYS;

  const SLOT_DURATION_MINUTES = 60;
  const DEFAULT_CAPACITY = 4;

  // ------------------------------
  // helpers
  // ------------------------------
  function isWeekend(date: Date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function buildSlotsForDate(date: Date) {
    const openHour = 8;
    const closeHour = isWeekend(date) ? 16 : 20;

    const slots: Array<{ start: Date; end: Date }> = [];

    for (let hour = openHour; hour < closeHour; hour++) {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES);

      // กัน slot ทะลุเวลาปิด
      if (
        end.getHours() > closeHour ||
        (end.getHours() === closeHour && end.getMinutes() > 0)
      ) {
        continue;
      }

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
      const d = addDays(startDate, i);

      const slots = buildSlotsForDate(d);
      for (const s of slots) {
        createBuffer.push({
          university_id: uni.university_id,
          time_slot_start_datetime: s.start,
          time_slot_end_datetime: s.end,
          time_slot_max_capacity: DEFAULT_CAPACITY,
          time_slot_status: TimeSlotStatus.AVAILABLE,
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
