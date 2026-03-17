import { PrismaClient, TimeSlotStatus, TimeSlot } from "@prisma/client";

// Inline helpers to avoid path resolution issues if run via tsx in root
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
  // 1. Set UTC time to the target face value (e.g., 08:00 UTC)
  const d = new Date(baseDate);
  d.setUTCHours(hour, minute, 0, 0);
  
  // 2. Shift back by 7 hours to get the actual UTC instant that equals 08:00 TH
  // (08:00 UTC - 7h = 01:00 UTC = 08:00 TH)
  d.setMinutes(d.getMinutes() - TH_OFFSET_MINUTES);
  return d;
}

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Targeted Time Slot Fix (Weekend Evening Patch)...");

  // 1. Get all universities
  const universities = await prisma.university.findMany({
    select: { university_id: true, university_code: true },
  });
  console.log(`Found ${universities.length} universities.`);

  const today0 = startOfDay(new Date());
  
  // Use exact same range as 08-timeslots.ts to ensure full coverage
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
      
      // Normalize to UTC Noon to avoid timezone shifting during setUTCHours (Date Shifting Bug Fix)
      // This matches the logic in 08-timeslots.ts
      const d = new Date(Date.UTC(distinctDate.getFullYear(), distinctDate.getMonth(), distinctDate.getDate(), 12, 0, 0));

      const day = d.getUTCDay();
      const isWeekend = day === 0 || day === 6; // 0=Sun, 6=Sat

      // Target Logic:
      // Previously: Weekends closed at 17:00 (last slot 16:00-17:00).
      // New: Weekends close at 20:00 (last slot 19:00-20:00).
      // Missing Hours: 17, 18, 19.
      
      if (isWeekend) {
        // Prepare ONLY the missing evening slots for weekends
        const missingStartHours = [17, 18, 19]; 

        for (const hour of missingStartHours) {
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
    }

    if (createBuffer.length > 0) {
      // safe insert with skipDuplicates
      const result = await prisma.timeSlot.createMany({
        data: createBuffer,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(`   + Added ${result.count} missing weekend slots for ${uni.university_code}`);
    } else {
      console.log(`   - No missing weekend slots found for ${uni.university_code}`);
    }
  }

  console.log("\n✅ Fix completed successfully!");
  console.log(`Total NEW slots inserted: ${totalInserted}`);
  console.log("Existing data was preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
