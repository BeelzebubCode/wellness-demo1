import { PrismaClient, BorrowAvailabilityStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Consultant Borrow Availability...");

    // Seed for the first 50 consultants
    const consultants = await prisma.consultant.findMany({
        take: 50,
    });

    const universities = await prisma.university.findMany();

    if (universities.length < 2) {
        console.log("Not enough universities to create cross-borrowing.");
        return;
    }

    let count = 0;

    for (let i = 0; i < consultants.length; i++) {
        const consultant = consultants[i];
        // Find a target university different from home
        const targetUni = universities.find(u => u.university_id !== consultant.university_id);
        if (!targetUni) continue;

        // Create one active borrow starting tomorrow, lasting 5 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 5);

        await prisma.consultantBorrowAvailability.create({
            data: {
                consultant_id: consultant.consultant_id,
                home_university_id: consultant.university_id,
                target_university_id: targetUni.university_id,
                availability_start_date: startDate,
                availability_end_date: endDate,
                status: BorrowAvailabilityStatus.ACTIVE,
            },
        });

        count++;
    }

    console.log(`✅ Seeded borrow availability for ${count} consultants.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
