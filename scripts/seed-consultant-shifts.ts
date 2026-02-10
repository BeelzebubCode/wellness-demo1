import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedConsultantShifts() {
  console.log("🔄 Seeding consultant shifts...");

  try {
    // 1. Find demo consultant accounts first
    const accounts = await prisma.account.findMany({
      where: {
        account_username: {
          in: ["c1_cu", "c2_nu", "c1_tu"], // Demo consultant accounts
        },
        consultant: {
          isNot: null,
        },
      },
      include: {
        consultant: true,
      },
    });

    const consultants = accounts
      .map((a) => a.consultant)
      .filter((c): c is NonNullable<typeof c> => c !== null);

    if (consultants.length === 0) {
      console.log("⚠️  No consultants found for seeding");
      return;
    }

    console.log(`Found ${consultants.length} consultants to seed shifts for`);

    for (const consultant of consultants) {
      console.log(`\n📋 Creating shifts for ${consultant.account.username}...`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

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

      console.log(`✅ Created current shift: ${currentShift.shift_id}`);

      // Create a borrow period for consultant c1_cu (days 2-3, already returned)
      if (account.account_username === "c1_cu") {
        const borrowStart = new Date(currentShiftStart);
        borrowStart.setDate(currentShiftStart.getDate() + 1); // Day 2

        const borrowEnd = new Date(borrowStart);
        borrowEnd.setDate(borrowStart.getDate() + 1); // Day 3

        // Find another university to borrow to
        const otherUniversity = await prisma.university.findFirst({
          where: {
            university_id: {
              not: consultant.university_id,
            },
          },
        });

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

          console.log(`✅ Created RETURNED borrow period`);
        }
      }

      // Create a borrow period for consultant c2_nu (currently on loan, days 4-6)
      if (account.account_username === "c2_nu") {
        const borrowStart = new Date(today); // Today
        const borrowEnd = new Date(today);
        borrowEnd.setDate(today.getDate() + 2); // 3 days from start (days 4-6)

        const otherUniversity = await prisma.university.findFirst({
          where: {
            university_id: {
              not: consultant.university_id,
            },
          },
        });

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

          console.log(`✅ Created ACTIVE borrow period (currently on loan)`);
        }
      }

      // Create a completed shift from 1 month ago
      const completedShiftStart = new Date(today);
      completedShiftStart.setDate(today.getDate() - 30);

      const completedShiftEnd = new Date(completedShiftStart);
      completedShiftEnd.setDate(completedShiftStart.getDate() + 13);

      const completedShift = await prisma.consultantShift.create({
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

      console.log(`✅ Created completed shift: ${completedShift.shift_id}`);

      // Create an upcoming shift (starts in 10 days)
      const upcomingShiftStart = new Date(today);
      upcomingShiftStart.setDate(today.getDate() + 10);

      const upcomingShiftEnd = new Date(upcomingShiftStart);
      upcomingShiftEnd.setDate(upcomingShiftStart.getDate() + 13);

      const upcomingShift = await prisma.consultantShift.create({
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

      console.log(`✅ Created upcoming shift: ${upcomingShift.shift_id}`);
    }

    console.log("\n✅ Consultant shifts seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding consultant shifts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedConsultantShifts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
