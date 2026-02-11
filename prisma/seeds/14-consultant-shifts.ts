// prisma/seeds/14-consultant-shifts.ts
// 🔄 Rotation-based shift seeding: 5 consultants per university
// rotating in 14-day cycles across 1 year of history

import { PrismaClient } from "@prisma/client";

const SHIFT_DAYS = 14;
const HISTORY_DAYS = 365; // 1 year of shift history
const BORROW_CHANCE = 0.10; // 10% of completed shifts have a borrow period
const BORROW_DURATION_MIN = 2;
const BORROW_DURATION_MAX = 4;
const BATCH_SIZE = 2000;

export async function seedConsultantShifts(
  prisma: PrismaClient,
  args: {
    consultants: any[];
    universities: any[];
  }
) {
  console.log("\n🔄 Seeding consultant shifts (rotation-based, 1-year history)...");

  const { consultants, universities } = args;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group consultants by university
  const consultantsByUniId = new Map<number, any[]>();
  for (const c of consultants) {
    const list = consultantsByUniId.get(c.university_id) ?? [];
    list.push(c);
    consultantsByUniId.set(c.university_id, list);
  }

  // Preload all university IDs for borrow targets
  const allUniIds = universities.map((u: any) => u.university_id);

  let totalShiftsCreated = 0;
  let totalBorrowsCreated = 0;

  // Collect batch data
  const shiftBatch: any[] = [];
  // Borrows need shift_id, so we process them after shift insert

  for (const uni of universities) {
    const uniConsultants = consultantsByUniId.get(uni.university_id);
    if (!uniConsultants || uniConsultants.length === 0) continue;

    const numConsultants = uniConsultants.length; // typically 5

    // Calculate start date: 1 year ago, aligned to shift cycle
    const historyStart = new Date(today);
    historyStart.setDate(today.getDate() - HISTORY_DAYS);

    let shiftIndex = 0;
    let currentDate = new Date(historyStart);

    while (currentDate < new Date(today.getTime() + SHIFT_DAYS * 86400000)) {
      const consultant = uniConsultants[shiftIndex % numConsultants];

      const shiftStart = new Date(currentDate);
      const shiftEnd = new Date(currentDate);
      shiftEnd.setDate(shiftEnd.getDate() + SHIFT_DAYS - 1);

      // Determine status and progress
      let status: string;
      let daysWorked: number;
      let daysRemaining: number;
      let completedAt: Date | null = null;

      if (shiftEnd < today) {
        // Fully completed shift
        status = "COMPLETED";
        daysWorked = SHIFT_DAYS;
        daysRemaining = 0;
        completedAt = shiftEnd;
      } else if (shiftStart <= today) {
        // Currently active shift
        const elapsed = Math.floor(
          (today.getTime() - shiftStart.getTime()) / 86400000
        );
        status = "ACTIVE";
        daysWorked = Math.min(elapsed, SHIFT_DAYS);
        daysRemaining = SHIFT_DAYS - daysWorked;
      } else {
        // Future/upcoming shift
        status = "ACTIVE";
        daysWorked = 0;
        daysRemaining = SHIFT_DAYS;
      }

      shiftBatch.push({
        consultant_id: consultant.consultant_id,
        university_id: uni.university_id,
        shift_start_date: shiftStart,
        shift_end_date: shiftEnd,
        days_worked: daysWorked,
        days_remaining: daysRemaining,
        status,
        completed_at: completedAt,
        // Metadata for borrow generation (not stored)
        _isCompleted: status === "COMPLETED",
        _uniId: uni.university_id,
      });

      currentDate.setDate(currentDate.getDate() + SHIFT_DAYS);
      shiftIndex++;
    }
  }

  console.log(`   📦 Prepared ${shiftBatch.length} shifts across ${universities.length} universities`);

  // Insert shifts in batches
  for (let i = 0; i < shiftBatch.length; i += BATCH_SIZE) {
    const batch = shiftBatch.slice(i, i + BATCH_SIZE);
    const cleanBatch = batch.map(({ _isCompleted, _uniId, ...rest }) => rest);

    await prisma.consultantShift.createMany({
      data: cleanBatch,
      skipDuplicates: true,
    });

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= shiftBatch.length) {
      console.log(`   ├─ Shifts: ${Math.min(i + BATCH_SIZE, shiftBatch.length)}/${shiftBatch.length}`);
    }
  }

  totalShiftsCreated = shiftBatch.length;
  console.log(`   ✅ Created ${totalShiftsCreated} consultant shifts`);

  // Now create borrow periods for ~10% of completed shifts
  console.log("   🔀 Creating borrow periods...");

  // Fetch all created shifts to get their IDs
  const allShifts = await prisma.consultantShift.findMany({
    where: { status: "COMPLETED" },
    select: {
      shift_id: true,
      university_id: true,
      shift_start_date: true,
      shift_end_date: true,
    },
  });

  const borrowData: any[] = [];

  for (const shift of allShifts) {
    if (Math.random() > BORROW_CHANCE) continue;

    // Pick a random university to borrow to (not the same)
    const otherUnis = allUniIds.filter((id) => id !== shift.university_id);
    if (otherUnis.length === 0) continue;

    const borrowToUniId = otherUnis[Math.floor(Math.random() * otherUnis.length)];

    // Borrow starts 2-5 days into the shift
    const shiftStartMs = new Date(shift.shift_start_date).getTime();
    const offsetDays = 2 + Math.floor(Math.random() * 4); // day 2-5
    const borrowStart = new Date(shiftStartMs + offsetDays * 86400000);

    const duration = BORROW_DURATION_MIN + Math.floor(
      Math.random() * (BORROW_DURATION_MAX - BORROW_DURATION_MIN + 1)
    );
    const borrowEnd = new Date(borrowStart.getTime() + (duration - 1) * 86400000);

    // Make sure borrow end doesn't exceed shift end
    const shiftEndMs = new Date(shift.shift_end_date).getTime();
    const actualBorrowEnd = new Date(Math.min(borrowEnd.getTime(), shiftEndMs));

    borrowData.push({
      shift_id: shift.shift_id,
      borrowed_to_university_id: borrowToUniId,
      borrow_start_date: borrowStart,
      borrow_end_date: actualBorrowEnd,
      actual_return_date: actualBorrowEnd, // Completed shifts → returned
      status: "RETURNED",
    });
  }

  // Also add an ACTIVE borrow for the current active shift (first uni only for demo)
  const activeShifts = await prisma.consultantShift.findMany({
    where: { status: "ACTIVE", days_worked: { gt: 0 } },
    select: {
      shift_id: true,
      university_id: true,
      shift_start_date: true,
      shift_end_date: true,
    },
    take: 3, // Create 3 active borrows for demo
  });

  for (const activeShift of activeShifts) {
    const otherUnis = allUniIds.filter((id) => id !== activeShift.university_id);
    if (otherUnis.length === 0) continue;

    const borrowToUniId = otherUnis[Math.floor(Math.random() * otherUnis.length)];

    borrowData.push({
      shift_id: activeShift.shift_id,
      borrowed_to_university_id: borrowToUniId,
      borrow_start_date: today,
      borrow_end_date: new Date(today.getTime() + 2 * 86400000),
      status: "ACTIVE",
    });

    // Update that shift's status to ON_LOAN
    await prisma.consultantShift.update({
      where: { shift_id: activeShift.shift_id },
      data: { status: "ON_LOAN" },
    });
  }

  // Insert borrow periods in batches
  for (let i = 0; i < borrowData.length; i += BATCH_SIZE) {
    const batch = borrowData.slice(i, i + BATCH_SIZE);
    await prisma.shiftBorrowPeriod.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  totalBorrowsCreated = borrowData.length;

  console.log(`   ✅ Created ${totalBorrowsCreated} borrow periods`);
  console.log(`   📊 Summary: ${totalShiftsCreated} shifts, ${totalBorrowsCreated} borrows, ${activeShifts.length} on-loan`);
}
