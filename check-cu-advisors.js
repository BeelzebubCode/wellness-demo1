
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking CU Advisors...");

    const cu = await prisma.university.findFirst({
        where: { university_code: 'CU' },
    });

    if (!cu) {
        console.error("❌ CU not found");
        return;
    }

    // Check progress for CU
    const total = await prisma.studentAcademic.count({
        where: { university_id: cu.university_id },
    });

    const assigned = await prisma.studentAcademic.count({
        where: {
            university_id: cu.university_id,
            NOT: { advisor_id: null },
        },
    });

    console.log(`\n🏫 CU (ID ${cu.university_id}) Progress: ${assigned} / ${total} (${((assigned / total) * 100).toFixed(2)}%)`);

    // Check sample advisors
    const cuAdvisors = await prisma.account.findMany({
        where: {
            account_home_university_id: cu.university_id,
            account_role: "ADVISOR"
        },
        take: 5,
        include: {
            advisor: {
                include: {
                    _count: {
                        select: { studentAcademics: true }
                    }
                }
            }
        }
    });

    cuAdvisors.forEach(acc => {
        console.log(`- [${acc.account_username}] Students: ${acc.advisor?._count.studentAcademics ?? 0}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
