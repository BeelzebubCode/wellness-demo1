import { PrismaClient, BorrowAvailabilityStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Re-seeding Consultant Borrow Availability (linked to real assignments)...");

    // Clear existing data
    const deleted = await prisma.consultantBorrowAvailability.deleteMany({});
    console.log(`  🗑️  Deleted ${deleted.count} old records.`);

    // Fetch all borrow assignments with their related data
    const assignments = await prisma.borrowAssignment.findMany({
        select: {
            borrow_assignment_id: true,
            consultant_id: true,
            consultant_university_id: true,
            borrow_assign_start_at: true,
            borrow_assign_end_at: true,
            borrowRequest: {
                select: {
                    from_university_id: true,
                },
            },
        },
        orderBy: { borrow_assignment_id: 'asc' },
    });

    if (assignments.length === 0) {
        console.log("No borrow assignments found — nothing to seed.");
        return;
    }

    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const a of assignments) {
        const isPast = a.borrow_assign_end_at < today;

        await prisma.consultantBorrowAvailability.create({
            data: {
                consultant_id: a.consultant_id,
                home_university_id: a.consultant_university_id,
                target_university_id: a.borrowRequest.from_university_id,
                borrow_assignment_id: a.borrow_assignment_id,
                availability_start_date: a.borrow_assign_start_at,
                availability_end_date: a.borrow_assign_end_at,
                status: isPast
                    ? BorrowAvailabilityStatus.COMPLETED
                    : BorrowAvailabilityStatus.ACTIVE,
                completed_at: isPast ? a.borrow_assign_end_at : null,
            },
        });

        count++;
    }

    console.log(`✅ Seeded ${count} borrow availability records (linked to borrow_assignment).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
