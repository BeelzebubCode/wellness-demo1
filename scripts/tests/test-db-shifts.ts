import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const shifts = await prisma.consultantBorrowAvailability.findMany({
        include: {
            consultant: true
        }
    });

    console.log("Found shifts:", shifts.length);
    shifts.forEach(s => {
        console.log(`[Consultant ${s.consultant_id}]`, s.availability_start_date, 'to', s.availability_end_date, 'status:', s.status);
    });
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
