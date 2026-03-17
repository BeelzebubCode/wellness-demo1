
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking Advisor Data...");

  // 1. Check a few advisor accounts
  const advisorAccounts = await prisma.account.findMany({
    where: { account_role: "ADVISOR" },
    take: 5,
    include: {
      advisor: {
        include: {
            // Count students
            _count: {
                select: { studentAcademics: true }
            }
        }
      }
    }
  });

  console.log(`\n👨‍🏫 Found ${advisorAccounts.length} Advisor Accounts (sample):`);
  
  for (const acc of advisorAccounts) {
      console.log(`  - [${acc.account_username}] ID: ${acc.account_id}`);
      if (acc.advisor) {
          console.log(`    ✅ Advisor Profile Found (ID: ${acc.advisor.advisor_id})`);
          console.log(`    🎓 Assigned Students: ${acc.advisor._count.studentAcademics}`);
      } else {
          console.log(`    ❌ No Advisor Profile Linked!`);
      }
  }

  if (advisorAccounts.length === 0) {
      console.log("❌ No Advisor accounts found!");
      return;
  }

  // 2. Pick one advisor with students and list details
  const activeAdvisor = advisorAccounts.find(a => a.advisor && a.advisor._count.studentAcademics > 0);
  if (activeAdvisor && activeAdvisor.advisor) {
      console.log(`\n🔎 Inspecting Advisor: ${activeAdvisor.account_username}`);
      
      const students = await prisma.studentAcademic.findMany({
          where: { advisor_id: activeAdvisor.advisor?.advisor_id },
          take: 5,
          include: {
              student: {
                  include: {
                      profile: true,
                      bookings: { take: 1 }
                  }
              }
          }
      });

      console.log(`    Students (First 5):`);
      for (const sa of students) {
          const s = sa.student;
          console.log(`    - ${s.student_code} ${s.profile?.student_first_name_th} ${s.profile?.student_last_name_th}`);
          console.log(`      Bookings: ${s.bookings.length}`);
      }
  } else {
      console.log("\n⚠️ Sampled advisors have no students assigned.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
