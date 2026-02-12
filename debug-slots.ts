
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find a Monday
  // Current time approx 2026-02-13 (Fri)
  // Let's look at 2026-02-16 (Mon)
  
  // Note: Database stores UTC.
  // 08:00 TH = 01:00 UTC
  // 19:00 TH = 12:00 UTC (Last slot start)
  // 20:00 TH = 13:00 UTC (End of last slot)

  // Fetch slots for a range covering a Mon and Sat
  // Mon Feb 16 2026
  // Sat Feb 14 2026

  const slots = await prisma.timeSlot.findMany({
    where: {
      time_slot_start_datetime: {
        gte: new Date("2026-02-14T00:00:00Z"),
        lt: new Date("2026-02-15T00:00:00Z"),
      }
    },
    orderBy: {
      time_slot_start_datetime: 'asc'
    },
    take: 5000
  });

  // Group by day and print min/max
  const slotsByDay = new Map<string, { min: string, max: string, count: number }>();

  for (const s of slots) {
    // Convert to TH time for display
    // Add 7 hours to UTC string interpretation, or just format
    const startUTC = s.time_slot_start_datetime;
    const startTH = new Date(startUTC.getTime() + 7 * 60 * 60 * 1000);
    
    const dayKey = startTH.toISOString().split('T')[0];
    const timeStr = startTH.toISOString().split('T')[1].substring(0, 5); // HH:MM

    if (!slotsByDay.has(dayKey)) {
      slotsByDay.set(dayKey, { min: timeStr, max: timeStr, count: 0 });
    }
    const rec = slotsByDay.get(dayKey)!;
    if (timeStr < rec.min) rec.min = timeStr;
    if (timeStr > rec.max) rec.max = timeStr;
    rec.count++;
  }

  console.log("Existing Slots (Converted to TH Time):");
  for (const [day, data] of slotsByDay.entries()) {
     const dateObj = new Date(day);
     const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // This might use system locale, careful
     // Manual day check
     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
     const dName = days[new Date(day).getDay()]; // 0=Sun

     console.log(`${day} (${dName}): ${data.min} - ${data.max} (Count: ${data.count})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
