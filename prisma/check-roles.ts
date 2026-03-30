import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.accountRoleCategory.findMany();
  console.log("ROLES:", roles);
}

main().finally(() => prisma.$disconnect());
