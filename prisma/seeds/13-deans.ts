// prisma/seeds/13-deans.ts
import { PrismaClient } from "@prisma/client";

interface SeedDeansOpts {
  universities: any[];
  passwordHash: string;
}

export async function seedDeans(
  prisma: PrismaClient,
  opts: SeedDeansOpts
) {
  console.log("\n👔 Seeding Deans (Batch Mode)...");

  const { universities, passwordHash } = opts;
  const BATCH_SIZE = 20;
  let totalDeansCreated = 0;

  for (let i = 0; i < universities.length; i += BATCH_SIZE) {
    const uniBatch = universities.slice(i, i + BATCH_SIZE);
    const uniIds = uniBatch.map(u => u.university_id);

    // 1. Fetch faculties
    const faculties = await prisma.faculty.findMany({
      where: { university_id: { in: uniIds } },
    });

    const accountsToCreate: any[] = [];
    // username -> faculty_id
    const deanFacultyMap = new Map<string, number>();

    for (const uni of uniBatch) {
      const uniCode = String(uni.university_code).toLowerCase();
      const uniFaculties = faculties.filter(f => f.university_id === uni.university_id);

      for (const faculty of uniFaculties) {
        const facCode = faculty.faculty_code.toLowerCase();
        const username = `dean_${uniCode}_${facCode}`;
        
        accountsToCreate.push({
          account_username: username,
          account_password: passwordHash,
          account_role: "DEAN",
          account_home_university_id: uni.university_id,
        });

        deanFacultyMap.set(username, faculty.faculty_id);
      }
    }

    if (accountsToCreate.length === 0) continue;

    // 2. Create Accounts
    await prisma.account.createMany({
      data: accountsToCreate,
      skipDuplicates: true,
    });

    // 3. Update Faculties with Dean Account IDs
    // Since we need to update existing rows, we can't easily use createMany.
    // However, we can fetch the accounts and then run parallel update promises.
    
    const createdAccounts = await prisma.account.findMany({
      where: { account_username: { in: accountsToCreate.map(a => a.account_username) } },
      select: { account_id: true, account_username: true },
    });

    // 3. Update Faculties (Chunked)
    const accountsToLink = createdAccounts.filter(acc => deanFacultyMap.has(acc.account_username));
    const UPDATE_CHUNK_SIZE = 20; // Safe size for connection pool

    for (let j = 0; j < accountsToLink.length; j += UPDATE_CHUNK_SIZE) {
      const chunk = accountsToLink.slice(j, j + UPDATE_CHUNK_SIZE);
      await Promise.all(chunk.map(acc => {
         const facultyId = deanFacultyMap.get(acc.account_username);
         return prisma.faculty.update({
            where: { faculty_id: facultyId },
            data: { dean_account_id: acc.account_id },
         });
      }));
    }

    totalDeansCreated += createdAccounts.length;
    console.log(`   ✅ Processed batch ${i / BATCH_SIZE + 1}: ${createdAccounts.length} deans created/linked`);
  }

  console.log(`✅ Total Dean accounts created: ${totalDeansCreated}`);
  return [];
}
