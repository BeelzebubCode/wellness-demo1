
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = "dean_cu_eng";
  console.log(`🔍 Checking data for: ${username}`);

  const account = await prisma.account.findUnique({
    where: { account_username: username },
    include: {
        facultiesDean: {
            include: {
                university: true
            }
        },
        consultant: true,
        advisor: true,
        homeUniversity: true,
    }
  });

  if (!account) {
    console.error("❌ Account not found");
    return;
  }

  console.log("✅ Account:", {
    id: account.account_id,
    role: account.account_role,
    homeUni: account.homeUniversity?.university_name_th,
  });

  console.log("✅ Dean of Faculties:", account.facultiesDean.map(f => ({
    code: f.faculty_code,
    name: f.faculty_name_th,
    uni: f.university.university_name_th
  })));

  // Check if university access exists
  const access = await prisma.accountUniversityAccess.findMany({
    where: { account_id: account.account_id }
  });
  console.log("✅ University Access:", access);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
