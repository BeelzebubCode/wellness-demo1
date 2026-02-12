// prisma/seeds/04-advisor.ts
import { PrismaClient, AccountRole } from "@prisma/client";
import { firstNames, lastNames } from "../seed-data/people";

// Helper functions (same as before)
function hash32(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDeterministic<T>(arr: readonly T[], key: string, salt: string) {
  const idx = hash32(`${salt}:${key}`) % arr.length;
  return arr[idx];
}

function randRangeDeterministic(
  key: string,
  salt: string,
  min: number,
  max: number,
) {
  const span = max - min + 1;
  return min + (hash32(`${salt}:${key}`) % span);
}

export async function seedAdvisors(
  prisma: PrismaClient,
  args: {
    universities: any[];
    passwordHash: string;
  },
) {
  console.log("\n👨‍🏫 Seeding advisors (Batch Mode)...");

  const { universities, passwordHash } = args;

  // Data pools
  const ranks = ["Asst. Prof.", "Assoc. Prof.", "Lecturer"] as const;
  const prefixes = ["ดร.", "ผศ.ดร.", "อ."] as const;
  const buildings = ["A", "B", "C", "D"] as const;

  const BATCH_SIZE = 20; // Process 20 universities at a time
  let totalAdvisorsCreated = 0;

  // Chunk universities
  for (let i = 0; i < universities.length; i += BATCH_SIZE) {
    const uniBatch = universities.slice(i, i + BATCH_SIZE);
    const uniIds = uniBatch.map(u => u.university_id);
    
    // 1. Fetch all faculties and departments for this batch of universities
    const faculties = await prisma.faculty.findMany({
      where: { university_id: { in: uniIds } },
      include: { departments: true },
    });

    const accountsToCreate: any[] = [];
    const advisorsToCreate: any[] = [];
    
    // Map to store temporary relationships
    // username -> { advisor data }
    const advisorDataMap = new Map<string, any>();

    // Prepare data
    for (const uni of uniBatch) {
      const uniCode = String(uni.university_code).toLowerCase();
      const uniFaculties = faculties.filter(f => f.university_id === uni.university_id);

      for (const faculty of uniFaculties) {
        for (const dept of faculty.departments) {
          const deptCode = dept.department_code.toLowerCase();
          const username = `advisor_${uniCode}_${deptCode}`;
          const email = `${username}@${uniCode}.ac.th`;

          // Account Data
          accountsToCreate.push({
            account_username: username,
            account_password: passwordHash,
            account_role: AccountRole.ADVISOR,
            account_home_university_id: uni.university_id,
          });

          // Advisor Data details (deterministic)
          const advisor_academic_rank = pickDeterministic(ranks, email, "rank");
          const advisor_prefix = pickDeterministic(prefixes, email, "prefix");
          const advisor_first_name = pickDeterministic(firstNames, email, "fname");
          const advisor_last_name = pickDeterministic(lastNames, email, "lname");
          const advisor_phone_number = `0${randRangeDeterministic(email, "phone", 800000000, 899999999)}`;
          const advisor_office_location = `Building ${pickDeterministic(buildings, email, "bld")}, Room ${randRangeDeterministic(email, "room", 101, 499)}`;

          advisorDataMap.set(username, {
            university_id: uni.university_id,
            faculty_id: faculty.faculty_id,
            department_id: dept.department_id,
            advisor_academic_rank,
            advisor_prefix,
            advisor_first_name,
            advisor_last_name,
            advisor_email: email,
            advisor_phone_number,
            advisor_office_location,
          });
        }
      }
    }

    if (accountsToCreate.length === 0) continue;

    // 2. Batch Create Accounts
    await prisma.account.createMany({
      data: accountsToCreate,
      skipDuplicates: true,
    });

    // 3. Fetch Created Accounts to get IDs
    const createdAccounts = await prisma.account.findMany({
      where: { account_username: { in: accountsToCreate.map(a => a.account_username) } },
      select: { account_id: true, account_username: true },
    });

    // 4. Prepare Advisor Records with Account IDs
    const finalAdvisors = [];
    for (const acc of createdAccounts) {
      const data = advisorDataMap.get(acc.account_username);
      if (data) {
        finalAdvisors.push({
          ...data,
          account_id: acc.account_id,
        });
      }
    }

    // 5. Batch Create Advisors
    if (finalAdvisors.length > 0) {
      await prisma.advisor.createMany({
        data: finalAdvisors,
        skipDuplicates: true,
      });
      totalAdvisorsCreated += finalAdvisors.length;
    }
  }
  
  // ✅ Fetch all advisors for the seeded universities to return
  const allAdvisors = await prisma.advisor.findMany({
    where: { 
      university_id: { in: universities.map(u => u.university_id) } 
    }
  });

  console.log(`\n✅ Total advisors created/found: ${allAdvisors.length}`);
  return allAdvisors;
}
