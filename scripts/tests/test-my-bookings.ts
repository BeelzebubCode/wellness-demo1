import { PrismaClient } from '@prisma/client';
import { BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const l = 50;
        const skip = 0;
        const activeUniversityId = 1; // Assuming 1 for testing
        const consultantId = 1; // Assuming 1 for testing

        const where: any = {
            university_id: activeUniversityId,
            booking_status: {
                in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED],
            },
            OR: [
                { consultant_id: consultantId },
                {
                    assignments: {
                        some: {
                            consultant_id: consultantId,
                            consultant_university_id: activeUniversityId,
                        },
                    },
                },
            ],
        };

        console.log("Running query...");
        const bookings = await prisma.booking.findMany({
            where,
            include: {
                problemCategory: true,
                timeSlot: true,
                student: { include: { profile: true } },
                BookingSession: { include: { onlineChannel: true } },
                onlineChannel: true,
                university: { select: { university_name_th: true, university_code: true } },
                attendance: true,
            },
            orderBy: { booking_updated_at: "desc" },
            skip,
            take: l,
        });
        console.log(`Found ${bookings.length} bookings.`);
    } catch (e: any) {
        console.error("Prisma Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
