
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Listing valid Dean accounts...");
  
  const deans = await prisma.account.findMany({
    where: { account_role: "DEAN" },
    select: { account_username: true },
    orderBy: { account_username: "asc" },
  });

  console.log(`Found ${deans.length} Deans.`);
  console.log("Sample Usernames:");
  deans.slice(0, 20).forEach(d => console.log(` - ${d.account_username}`));

  // Check specific ones I suspect
  const suspects = ["dean_nu_sci", "dean_cu_eng", "dean_kku_agr"];
  console.log("\nChecking Demo Setup Candidates:");
  for (const s of suspects) {
    const found = deans.find(d => d.account_username === s);
    console.log(` - ${s}: ${found ? "✅ VALID" : "❌ INVALID"}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
