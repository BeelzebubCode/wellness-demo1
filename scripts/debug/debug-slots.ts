
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Target: Saturday Feb 14, 2026
  // In TH time: 14/02/2026 00:00 to 14/02/2026 23:59
  // In UTC: 13/02/2026 17:00 to 14/02/2026 17:00
  
  const startUTC = new Date("2026-02-13T17:00:00.000Z");
  const endUTC = new Date("2026-02-14T17:00:00.000Z");

  console.log(`\n🔎 Checking slots for Saturday (TH Time)`);
  console.log(`   Query Range (UTC): ${startUTC.toISOString()} - ${endUTC.toISOString()}`);

  const slots = await prisma.timeSlot.findMany({
    where: {
      time_slot_start_datetime: {
        gte: startUTC,
        lt: endUTC,
      },
      // Check for a specific university to reduce noise? Let's verify 'CU' (Uni ID 1 usually)
      university_id: 1 
    },
    orderBy: { time_slot_start_datetime: 'asc' },
  });

  console.log(`\nFound ${slots.length} slots for University ID 1:`);
  
  if (slots.length === 0) {
    console.log("❌ No slots found!");
  }

  // Group by hour to see distribution
  const countsByHour = new Map<string, number>();

  slots.forEach(s => {
    const timeStr = s.time_slot_start_datetime.toISOString().split('T')[1].substring(0, 5); // HH:MM
    countsByHour.set(timeStr, (countsByHour.get(timeStr) || 0) + 1);
  });

  console.log("\n📊 Slot Distribution (UTC time -> TH Time):");
  const sortedTimes = Array.from(countsByHour.keys()).sort();
  
  for (const utcTime of sortedTimes) {
    const [h, m] = utcTime.split(':').map(Number);
    const thHour = (h + 7) % 24;
    const thTime = `${String(thHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    console.log(`   UTC ${utcTime}  =>  TH ${thTime}  : ${countsByHour.get(utcTime)} slots`);
  }

  console.log("\n---------------------------------------------------");
  console.log("Expected (TH): 08:00, 09:00 ... 19:00 (ends 20:00)");
  console.log("Expected (UTC): 01:00, 02:00 ... 12:00");
  console.log("---------------------------------------------------\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
