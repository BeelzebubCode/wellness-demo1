
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking Advisor Data (JS Mode) - Finding assigned advisors...");

    // Find advisors who HAVE students
    // This query looks for accounts with role 'ADVISOR' where the associated 'advisor' record has at least one studentAcademic linked.
    const advisorAccounts = await prisma.account.findMany({
        where: {
            account_role: "ADVISOR",
            advisor: {
                studentAcademics: { some: {} }
            }
        },
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

    console.log(`\n👨‍🏫 Found ${advisorAccounts.length} Advisor Accounts with students:`);

    if (advisorAccounts.length === 0) {
        console.log("❌ No Advisor accounts with students found yet (patch still running?)");
        return;
    }

    for (const acc of advisorAccounts) {
        console.log(`  - [${acc.account_username}] ID: ${acc.account_id}`);
        if (acc.advisor) {
            console.log(`    ✅ Advisor Profile Found (ID: ${acc.advisor.advisor_id})`);
            console.log(`    🎓 Assigned Students: ${acc.advisor._count.studentAcademics}`);
        }
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
