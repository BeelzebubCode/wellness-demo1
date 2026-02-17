
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 Verifying DayPeriods and TimeSlots...");

  const periods = await prisma.dayPeriod.findMany();
  console.log(`✅ Found ${periods.length} day periods.`);
  if (periods.length === 0) {
      console.error("❌ No day periods found!");
  } else {
      console.log("Sample period:", periods[0]);
  }

  const slots = await prisma.timeSlot.findMany({ take: 5 });
  console.log(`✅ Found ${slots.length} time slots (sample).`);
  
  const slotsWithPeriod = await prisma.timeSlot.count({
      where: { day_period_id: { not: null } }
  });
  const totalSlots = await prisma.timeSlot.count();

  console.log(`📊 Slots with DayPeriod: ${slotsWithPeriod} / ${totalSlots}`);

  if (slotsWithPeriod === 0 && totalSlots > 0) {
      console.error("❌ No slots have day_period_id assigned!");
  } else if (slotsWithPeriod < totalSlots) {
      console.warn("⚠️ some slots are missing day_period_id (might be expected for night slots?)");
  } else {
      console.log("✅ All slots have day_period_id.");
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
