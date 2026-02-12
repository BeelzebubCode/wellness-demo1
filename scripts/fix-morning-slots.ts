
import { PrismaClient, TimeSlotStatus, TimeSlot } from "@prisma/client";

// Inline helpers
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

const TH_OFFSET_MINUTES = 7 * 60;
function toThaiDate(baseDate: Date, hour: number, minute: number = 0): Date {
  const d = new Date(baseDate);
  d.setUTCHours(hour, minute, 0, 0);
  d.setMinutes(d.getMinutes() - TH_OFFSET_MINUTES);
  return d;
}

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Morning Slot Fix (Backfilling 08:00-14:00)...");

  // 1. Get all universities
  const universities = await prisma.university.findMany({
    select: { university_id: true, university_code: true },
  });
  console.log(`Found ${universities.length} universities.`);

  const today0 = startOfDay(new Date());
  
  const PAST_DAYS = 365;
  const FUTURE_DAYS = 14;
  const TOTAL_DAYS = PAST_DAYS + FUTURE_DAYS;
  const startDate = addDays(today0, -PAST_DAYS);

  const SLOT_DURATION_MINUTES = 60;
  const DEFAULT_CAPACITY = 4;

  let totalInserted = 0;

  for (const uni of universities) {
    const createBuffer: Omit<TimeSlot, "time_slot_id">[] = [];
    console.log(`Processing ${uni.university_code}...`);

    for (let i = 0; i <= TOTAL_DAYS; i++) {
      const distinctDate = addDays(startDate, i);
      
      // Normalize to UTC Noon
      const d = new Date(Date.UTC(distinctDate.getFullYear(), distinctDate.getMonth(), distinctDate.getDate(), 12, 0, 0));

      // The existing data seems shifted +7h, starting at 15:00 TH.
      // We need to fill the gap 08:00 - 14:00 TH.
      // 08:00 TH, 09:00 TH, 10:00 TH, 11:00 TH, 12:00 TH, 13:00 TH, 14:00 TH.
      const missingMorningHours = [8, 9, 10, 11, 12, 13, 14];

      for (const hour of missingMorningHours) {
         const start = toThaiDate(d, hour, 0);
         const end = new Date(start);
         end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES);

         createBuffer.push({
           university_id: uni.university_id,
           time_slot_start_datetime: start,
           time_slot_end_datetime: end,
           time_slot_max_capacity: DEFAULT_CAPACITY,
           time_slot_status: TimeSlotStatus.OPEN,
         });
      }
    }

    if (createBuffer.length > 0) {
      // Chunking to avoid parameter limit issues if buffer is huge
      const CHUNK_SIZE = 5000;
      for (let j = 0; j < createBuffer.length; j += CHUNK_SIZE) {
        const chunk = createBuffer.slice(j, j + CHUNK_SIZE);
        const result = await prisma.timeSlot.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        totalInserted += result.count;
      }
      console.log(`   + Processed buffer for ${uni.university_code}`);
    }
  }

  console.log("\n✅ Morning Fix completed successfully!");
  console.log(`Total NEW slots inserted: ${totalInserted}`);
  
  // Optional: Verify integrity
  console.log("\n🔎 Final Check: Does 08:00 exist?");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
