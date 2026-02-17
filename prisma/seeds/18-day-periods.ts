
import { PrismaClient } from "@prisma/client";

export async function seedDayPeriods(prisma: PrismaClient, args: { universities: { university_id: number }[] }) {
  console.log("🌞 Seeding DayPeriods...");

  const { universities } = args;

  const PERIODS = [
    {
      code: "MORNING",
      nameTh: "ช่วงเช้า",
      nameEn: "Morning",
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T12:00:00Z"),
      sortOrder: 1,
    },
    {
      code: "AFTERNOON",
      nameTh: "ช่วงบ่าย",
      nameEn: "Afternoon",
      startTime: new Date("1970-01-01T12:00:00Z"),
      endTime: new Date("1970-01-01T16:00:00Z"),
      sortOrder: 2,
    },
    {
      code: "EVENING",
      nameTh: "ช่วงเย็น",
      nameEn: "Evening",
      startTime: new Date("1970-01-01T16:00:00Z"),
      endTime: new Date("1970-01-01T20:00:00Z"),
      sortOrder: 3,
    },
  ];

  for (const uni of universities) {
    for (const p of PERIODS) {
      await prisma.dayPeriod.upsert({
        where: {
          university_id_day_period_code: {
            university_id: uni.university_id,
            day_period_code: p.code,
          },
        },
        update: {
          day_period_name_th: p.nameTh,
          day_period_name_en: p.nameEn,
          start_time: p.startTime,
          end_time: p.endTime,
          sort_order: p.sortOrder,
        },
        create: {
          university_id: uni.university_id,
          day_period_code: p.code,
          day_period_name_th: p.nameTh,
          day_period_name_en: p.nameEn,
          start_time: p.startTime,
          end_time: p.endTime,
          sort_order: p.sortOrder,
          is_active: true,
        },
      });
    }
  }

  console.log("✅ DayPeriods seeded.");
}
