
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Database Content ---');

    // 1. Check Faculties
    const faculties = await prisma.faculty.findMany();
    console.log(`Total Faculties: ${faculties.length}`);
    faculties.forEach(f => console.log(` - [${f.faculty_id}] ${f.faculty_name_th}`));

    // 2. Check Bookings
    const bookings = await prisma.booking.findMany({
        include: {
            student: {
                include: {
                    academic: true
                }
            },
            booking_outcome: true
        },
        take: 10
    });

    console.log(`\n--- Sample Bookings (First 10) ---`);
    if (bookings.length === 0) {
        console.log("NO BOOKINGS FOUND.");
    } else {
        bookings.forEach(b => {
            console.log(`ID: ${b.booking_id} | Date: ${b.booking_appointment_datetime} | Student: ${b.student_id}`);
            console.log(`   -> Faculty ID: ${b.student?.academic?.faculty_id || 'N/A'}`);
            console.log(`   -> Outcome: ${b.booking_outcome ? 'Yes' : 'No'}`);
            if (b.booking_outcome) {
                console.log(`       -> Risk Level: ${b.booking_outcome.booking_outcome_risk_level}`);
            }
        });
    }

    // 3. Check Date Range of Bookings
    const aggregate = await prisma.booking.aggregate({
        _min: { booking_appointment_datetime: true },
        _max: { booking_appointment_datetime: true },
        _count: true
    });

    console.log(`\n--- Booking Stats ---`);
    console.log(`Total Bookings: ${aggregate._count}`);
    console.log(`Earliest Date: ${aggregate._min.booking_appointment_datetime}`);
    console.log(`Latest Date: ${aggregate._max.booking_appointment_datetime}`);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
