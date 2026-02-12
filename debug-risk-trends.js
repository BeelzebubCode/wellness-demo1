
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getStudentRiskTrends(advisorAccountId) {
    console.log(`Fetching trends for Account ID: ${advisorAccountId}`);

    // 1. Get Advisor Profile
    const advisor = await prisma.advisor.findUnique({
        where: { account_id: advisorAccountId },
    });

    if (!advisor) return [];

    console.log("Advisor ID:", advisor.advisor_id);

    // 2. Aggregate outcomes
    const outcomes = await prisma.bookingOutcome.findMany({
        where: {
            booking: {
                student: {
                    academic: {
                        advisor_id: advisor.advisor_id
                    }
                }
            }
        },
        select: {
            booking_outcome_risk_level: true,
            booking_outcome_recorded_at: true
        },
        orderBy: {
            booking_outcome_recorded_at: 'asc'
        }
    });

    console.log(`Found ${outcomes.length} outcomes`);

    if (outcomes.length > 0) {
        console.log("Sample outcome recorded_at:", outcomes[0].booking_outcome_recorded_at);
        // This is safe even in older node/prisma
    }

    const grouped = outcomes.reduce((acc, curr) => {
        // This is the risky line if recorded_at is null or not a Date
        const month = curr.booking_outcome_recorded_at.toISOString().slice(0, 7);
        if (!acc[month]) acc[month] = { totalRisk: 0, count: 0 };
        if (curr.booking_outcome_risk_level) {
            acc[month].totalRisk += curr.booking_outcome_risk_level;
            acc[month].count++;
        }
        return acc;
    }, {});

    const trends = Object.entries(grouped).map(([month, data]) => ({
        month,
        averageRisk: data.count > 0 ? Number((data.totalRisk / data.count).toFixed(2)) : 0
    }));
    return trends;
}

async function main() {
    const targetId = 305; // advisor_bru_edu_ele (check account ID from previous log)
    try {
        const trends = await getStudentRiskTrends(targetId);
        console.log("\n📈 Trends:", trends);
    } catch (e) {
        console.error("❌ Error in Risk Trends:", e);
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
