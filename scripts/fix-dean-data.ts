
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️  Fixing Dean Data...");

  // 1. Find all Dean accounts
  const deans = await prisma.account.findMany({
    where: { account_role: "DEAN" },
    include: { universityAccesses: true }
  });

  console.log(`Found ${deans.length} Dean accounts.`);

  let updatedCount = 0;
  let accessDeletedCount = 0;

  for (const dean of deans) {
    const oldUsername = dean.account_username;
    const newUsername = oldUsername.toLowerCase();
    
    // Updates needed?
    const needsRename = oldUsername !== newUsername;
    const hasAccess = dean.universityAccesses.length > 0;

    if (needsRename) {
      // Check collision
      const existing = await prisma.account.findUnique({ where: { account_username: newUsername } });
      if (!existing) {
        await prisma.account.update({
          where: { account_id: dean.account_id },
          data: { account_username: newUsername }
        });
        // console.log(`  Renamed: ${oldUsername} -> ${newUsername}`);
        updatedCount++;
      } else {
        console.warn(`  Skipping rename for ${oldUsername}: ${newUsername} already exists.`);
      }
    }

    if (hasAccess) {
      await prisma.accountUniversityAccess.deleteMany({
        where: { account_id: dean.account_id }
      });
      // console.log(`  Removed access for: ${dean.account_id}`);
      accessDeletedCount++;
    }

    if (updatedCount % 100 === 0 && updatedCount > 0) process.stdout.write(".");
  }

  console.log("\n✅ Fix Complete:");
  console.log(`   - Renamed Accounts (to lowercase): ${updatedCount}`);
  console.log(`   - Removed AccountUniversityAccess: ${accessDeletedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
