
import { PrismaClient } from "@prisma/client";
import { regenerateSlotsByDate } from "../src/services/time-slots/handlers/regenerateByDate";
import { addDays, startOfDay } from "../prisma/seed-utils/date";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Full Slot Regeneration (Using Service Logic)...");
  console.log("This will purge old slots and create new ones using the corrected 08:00 - 20:00 template.");

  // 1. Get all universities
  const universities = await prisma.university.findMany({
    select: { university_id: true, university_code: true },
  });
  console.log(`Found ${universities.length} universities.`);

  const today0 = startOfDay(new Date());
  
  // Same range: Past 1 year + Future 2 weeks
  const PAST_DAYS = 365;
  const FUTURE_DAYS = 14;
  const TOTAL_DAYS = PAST_DAYS + FUTURE_DAYS;
  const startDate = addDays(today0, -PAST_DAYS);

  let totalDeleted = 0;
  let totalCreated = 0;

  for (const uni of universities) {
    console.log(`\nProcessing ${uni.university_code} (ID: ${uni.university_id})...`);
    
    // Process in batches of 30 days to avoid memory issues if any
    const BATCH_SIZE = 30;
    
    for (let i = 0; i <= TOTAL_DAYS; i++) {
        const distinctDate = addDays(startDate, i);
        const dateStr = distinctDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Use the service logic directly
        try {
            const result = await regenerateSlotsByDate(dateStr, uni.university_id);
            totalDeleted += result.deleted;
            totalCreated += result.created;
            
            if (i % 30 === 0) process.stdout.write('.');
        } catch (e: any) {
            console.error(`\nFailed to regenerate ${dateStr} for ${uni.university_code}: ${e.message}`);
        }
    }
    console.log(" Done.");
  }

  console.log("\n✅ Full Regeneration Completed!");
  console.log(`Total Slots Deleted (Old/Invalid): ${totalDeleted}`);
  console.log(`Total Slots Created (New/Correct): ${totalCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
