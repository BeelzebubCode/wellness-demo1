import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    const c = await prisma.academicPeriod.count();
    console.log("Record count in db using Prisma:", c);
    
    const sample = await prisma.$queryRaw`SELECT * FROM academic_period LIMIT 2`;
    console.log("Sample records using raw query:", sample);
}
run().finally(() => prisma.$disconnect());
