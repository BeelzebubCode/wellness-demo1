// prisma/seeds/14-consultant-shifts.ts
import { PrismaClient } from "@prisma/client";

export async function seedConsultantShifts(
  prisma: PrismaClient,
  args: {
    consultants: any[];
    universities: any[];
  }
) {
  console.log("\n🔄 Seeding consultant shifts...");

  const { consultants, universities } = args;

  // Take first 5 consultants for demo
  const selectedConsultants = consultants.slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let shiftsCreated = 0;
  let borrowPeriodsCreated = 0;

  for (let i = 0; i < selectedConsultants.length; i++) {
    const consultant = selectedConsultants[i];

    // Create a current active shift (started 4 days ago, 10 days remaining)
    const currentShiftStart = new Date(today);
    currentShiftStart.setDate(today.getDate() - 4);

    const currentShiftEnd = new Date(currentShiftStart);
    currentShiftEnd.setDate(currentShiftStart.getDate() + 13); // 14 days total

    const currentShift = await prisma.consultantShift.create({
      data: {
        consultant_id: consultant.consultant_id,
        university_id: consultant.university_id,
        shift_start_date: currentShiftStart,
        shift_end_date: currentShiftEnd,
        days_worked: 4,
        days_remaining: 10,
        status: "ACTIVE",
      },
    });

    shiftsCreated++;

    // For first consultant: add a RETURNED borrow period (days 2-3)
    if (i === 0) {
      const borrowStart = new Date(currentShiftStart);
      borrowStart.setDate(currentShiftStart.getDate() + 1); // Day 2

      const borrowEnd = new Date(borrowStart);
      borrowEnd.setDate(borrowStart.getDate() + 1); // Day 3

      // Find another university to borrow to
      const otherUniversity = universities.find(
        (u: any) => u.university_id !== consultant.university_id
      );

      if (otherUniversity) {
        await prisma.shiftBorrowPeriod.create({
          data: {
            shift_id: currentShift.shift_id,
            borrowed_to_university_id: otherUniversity.university_id,
            borrow_start_date: borrowStart,
            borrow_end_date: borrowEnd,
            actual_return_date: borrowEnd,
            status: "RETURNED",
          },
        });

        borrowPeriodsCreated++;
      }
    }

    // For second consultant: add ACTIVE borrow period (currently on loan, days 5-7)
    if (i === 1) {
      const borrowStart = new Date(today); // Today
      const borrowEnd = new Date(today);
      borrowEnd.setDate(today.getDate() + 2); // 3 days from start

      const otherUniversity = universities.find(
        (u: any) => u.university_id !== consultant.university_id
      );

      if (otherUniversity) {
        await prisma.shiftBorrowPeriod.create({
          data: {
            shift_id: currentShift.shift_id,
            borrowed_to_university_id: otherUniversity.university_id,
            borrow_start_date: borrowStart,
            borrow_end_date: borrowEnd,
            status: "ACTIVE",
          },
        });

        // Update shift status to ON_LOAN
        await prisma.consultantShift.update({
          where: { shift_id: currentShift.shift_id },
          data: { status: "ON_LOAN" },
        });

        borrowPeriodsCreated++;
      }
    }

    // Create a completed shift from 1 month ago
    const completedShiftStart = new Date(today);
    completedShiftStart.setDate(today.getDate() - 30);

    const completedShiftEnd = new Date(completedShiftStart);
    completedShiftEnd.setDate(completedShiftStart.getDate() + 13);

    await prisma.consultantShift.create({
      data: {
        consultant_id: consultant.consultant_id,
        university_id: consultant.university_id,
        shift_start_date: completedShiftStart,
        shift_end_date: completedShiftEnd,
        days_worked: 14,
        days_remaining: 0,
        status: "COMPLETED",
        completed_at: completedShiftEnd,
      },
    });

    shiftsCreated++;

    // Create an upcoming shift (starts in 10 days)
    const upcomingShiftStart = new Date(today);
    upcomingShiftStart.setDate(today.getDate() + 10);

    const upcomingShiftEnd = new Date(upcomingShiftStart);
    upcomingShiftEnd.setDate(upcomingShiftStart.getDate() + 13);

    await prisma.consultantShift.create({
      data: {
        consultant_id: consultant.consultant_id,
        university_id: consultant.university_id,
        shift_start_date: upcomingShiftStart,
        shift_end_date: upcomingShiftEnd,
        days_worked: 0,
        days_remaining: 14,
        status: "ACTIVE",
      },
    });

    shiftsCreated++;
  }

  console.log(`✅ Created ${shiftsCreated} consultant shifts and ${borrowPeriodsCreated} borrow periods`);
}
