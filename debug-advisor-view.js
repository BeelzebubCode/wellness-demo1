
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAdviseeStats(advisorAccountId) {
    console.log(`Fetching stats for Account ID: ${advisorAccountId}`);

    // 1. Get Advisor Profile
    const advisor = await prisma.advisor.findUnique({
        where: { account_id: advisorAccountId },
    });

    if (!advisor) {
        console.log("❌ Advisor profile not found for this account.");
        return null;
    }
    console.log(`✅ Advisor Profile Found: ID ${advisor.advisor_id}`);

    // 2. Count Students
    const totalStudents = await prisma.studentAcademic.count({
        where: { advisor_id: advisor.advisor_id },
    });
    console.log(`🎓 Total Students: ${totalStudents}`);

    // 3. Count Active Cases
    const activeCases = await prisma.booking.count({
        where: {
            student: {
                academic: {
                    advisor_id: advisor.advisor_id,
                },
            },
            booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] },
        },
    });
    console.log(`🔥 Active Cases: ${activeCases}`);

    // 4. High Risk
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const highRiskRecent = await prisma.bookingOutcome.count({
        where: {
            booking: {
                student: {
                    academic: {
                        advisor_id: advisor.advisor_id,
                    },
                },
            },
            booking_outcome_risk_level: { gte: 4 },
            booking_outcome_recorded_at: { gte: thirtyDaysAgo },
        },
    });
    console.log(`⚠️ High Risk Recent: ${highRiskRecent}`);

    return { totalStudents, activeCases, highRiskRecent };
}

async function main() {
    // Test with advisor_bru_edu_ele (ID 305 confirmed from previous step)
    const targetId = 305;

    const stats = await getAdviseeStats(targetId);
    console.log("\n📊 Final Stats Object:", stats);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
