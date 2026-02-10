
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Listing sample accounts for ALL roles...");

  const roles = [
    "SUPER_ADMIN",
    "MINISTRY",
    "RECTOR",
    "DEAN",
    "HEAD_CONSULTANT",
    "CONSULTANT",
    "ADVISOR",
    "POV", // If exists
    "STUDENT"
  ];

  for (const role of roles) {
    console.log(`\n--- ${role} ---`);
    try {
      const accounts = await prisma.account.findMany({
        where: { account_role: role as any },
        select: { account_username: true, account_role: true, account_home_university_id: true },
        take: 5,
        orderBy: { account_username: "asc" }
      });

      if (accounts.length === 0) {
        console.log("  (No accounts found)");
      } else {
        accounts.forEach(a => console.log(`  - ${a.account_username} (Uni: ${a.account_home_university_id})`));
      }
    } catch (e: any) {
      console.log(`  (Error listing ${role}: ${e.message})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
