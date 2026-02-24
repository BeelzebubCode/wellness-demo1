
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.problem_category.count();
    console.log(`Total Problem Categories: ${count}`);
    const samples = await prisma.problem_category.findMany({ take: 5 });
    console.log('Samples:', samples);
}

main().finally(() => prisma.$disconnect());
