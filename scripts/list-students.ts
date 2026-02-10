
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Listing Student accounts...");
  
  // Get a few students from different universities
  const students = await prisma.account.findMany({
    where: { account_role: "STUDENT" },
    select: { account_username: true },
    orderBy: { account_username: "asc" },
    take: 50,
  });

  console.log(`Found students (first 50):`);
  students.forEach(s => console.log(` - ${s.account_username}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
