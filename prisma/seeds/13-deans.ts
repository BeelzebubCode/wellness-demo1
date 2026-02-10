// prisma/seeds/13-deans.ts
import { PrismaClient, University, Faculty } from "@prisma/client";

interface SeedDeansOpts {
  universities: University[];
  facultyByUniAndCode: Map<string, Faculty>;
  passwordHash: string;
}

export async function seedDeans(
  prisma: PrismaClient,
  opts: SeedDeansOpts
) {
  console.log("\n👔 Seeding Dean accounts...");

  const deanAccounts = [];
  let totalDeans = 0;

  for (const uni of opts.universities) {
    // Get all faculties for this university
    const faculties = Array.from(opts.facultyByUniAndCode.entries())
      .filter(([key]) => key.startsWith(`${uni.university_code}_`))
      .map(([_, faculty]) => faculty);

    for (const faculty of faculties) {
      const username = `dean_${uni.university_code}_${faculty.faculty_code}`.toLowerCase();

      // Create dean account
      const deanAccount = await prisma.account.upsert({
        where: { account_username: username },
        update: {},
        create: {
          account_username: username,
          account_password: opts.passwordHash,
          account_role: "DEAN",
          account_home_university_id: uni.university_id,
        },
      });

      // Link dean to faculty
      await prisma.faculty.update({
        where: {
          university_id_faculty_id: {
            university_id: uni.university_id,
            faculty_id: faculty.faculty_id,
          },
        },
        data: {
          dean_account_id: deanAccount.account_id,
        },
      });

      deanAccounts.push(deanAccount);
      totalDeans++;
    }
  }

  console.log(`✅ Created ${totalDeans} Dean accounts`);
  console.log(`   Format: dean_{university_code}_{faculty_code}`);
  console.log(`   Example: dean_cu_eng, dean_mu_med`);

  return deanAccounts;
}
