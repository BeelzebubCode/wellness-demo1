
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.studentAcademic.count();
    const assigned = await prisma.studentAcademic.count({
        where: { NOT: { advisor_id: null } }
    });

    console.log(`Total Students: ${total}`);
    console.log(`Assigned Students: ${assigned}`);
    console.log(`Progress: ${((assigned / total) * 100).toFixed(2)}%`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
