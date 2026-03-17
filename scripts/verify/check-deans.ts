
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking Dean Accounts and Faculties...");

  // Check for CU (Chulalongkorn)
  const uniCode = "CU";
  const university = await prisma.university.findFirst({
    where: { university_code: uniCode },
  });

  if (!university) {
    console.error("❌ University CU not found");
    return;
  }

  console.log(`\n🏫 University: ${university.university_name_th} (${university.university_code})`);

  // Get all faculties for this university
  const faculties = await prisma.faculty.findMany({
    where: { university_id: university.university_id },
    include: {
      dean: true,
    },
  });

  console.log(`\n📚 Faculties (${faculties.length}):`);
  for (const f of faculties) {
    console.log(`  - [${f.faculty_code}] ${f.faculty_name_th}`);
    if (f.dean) {
      console.log(`    👤 Dean Account: ${f.dean.account_username} (ID: ${f.dean.account_id})`);
    } else {
      console.log(`    ❌ No Dean Assigned!`);
    }
  }

  // Check a specific Dean account to see what they "see"
  const targetUsername = "dean_cu_sc"; // Science
  const deanAccount = await prisma.account.findUnique({
    where: { account_username: targetUsername },
    include: {
        facultiesDean: true
    }
  });

  if (deanAccount) {
      console.log(`\n👤 Account Check: ${targetUsername}`);
      console.log(`   Linked Faculties: ${deanAccount.facultiesDean.map(f => f.faculty_code).join(", ")}`);
  } else {
      console.log(`\n❌ Account ${targetUsername} not found`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
