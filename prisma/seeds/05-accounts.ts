// prisma/seeds/05-accounts.ts
import { PrismaClient, AccountRole } from "@prisma/client";
import { randomInt, randomItem } from "../seed-utils/rand";

export async function seedAccounts(
  prisma: PrismaClient,
  args: { universities: any[]; org: any; passwordHash: string },
) {
  const { universities, org, passwordHash } = args;

  // ✅ deterministic order (เหมือน students)
  const sortedUnis = [...universities].sort(
    (a, b) => a.university_id - b.university_id,
  );

  console.log("👑 Upserting head accounts (ALL universities)...");

  // ✅ ใช้ key เป็น uniCode แบบ “ตัวใหญ่” เสมอ เพื่ออ่านง่าย
  const headsByUni: Record<string, { account: any; consultant: any }> = {};

  for (const uni of sortedUnis) {
    const uniCode = String(uni.university_code).toUpperCase();
    const uniCodeLower = uniCode.toLowerCase();
    const username = `head_${uniCodeLower}`;

    const headAccount = await prisma.account.upsert({
      where: { account_username: username },
      create: {
        account_username: username,
        account_password: passwordHash,
        account_role: AccountRole.HEAD_CONSULTANT,
        account_home_university_id: uni.university_id,
      },
      update: {
        account_password: passwordHash,
        account_role: AccountRole.HEAD_CONSULTANT,
        account_home_university_id: uni.university_id,
      },
    });

    const headConsultant = await prisma.consultant.upsert({
      where: { account_id: headAccount.account_id },
      create: {
        account_id: headAccount.account_id,
        university_id: uni.university_id,
        organization_id: org.organization_id,
      },
      update: {
        university_id: uni.university_id,
        organization_id: org.organization_id,
      },
    });

    await prisma.consultantProfile.upsert({
      where: { consultant_id: headConsultant.consultant_id },
      create: {
        consultant_id: headConsultant.consultant_id,
        consultant_first_name: "Head",
        consultant_last_name: uniCode,
        consultant_nickname: "Boss",
        consultant_email: `${username}@${uniCodeLower}.ac.th`,
        consultant_gender: randomItem(["MALE", "FEMALE"]) as any,
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
      update: {
        consultant_first_name: "Head",
        consultant_last_name: uniCode,
        consultant_nickname: "Boss",
        consultant_email: `${username}@${uniCodeLower}.ac.th`,
      },
    });

    await prisma.consultantLanguage.createMany({
      data: [
        {
          consultant_id: headConsultant.consultant_id,
          consultant_language_code: "TH",
          consultant_language_fluency_level: "NATIVE",
        },
        {
          consultant_id: headConsultant.consultant_id,
          consultant_language_code: "EN",
          consultant_language_fluency_level: "GOOD",
        },
      ],
      skipDuplicates: true,
    });

    await prisma.consultantSpecialization.createMany({
      data: [
        {
          consultant_id: headConsultant.consultant_id,
          consultant_specialization_topic: "Academic Counseling",
        },
        {
          consultant_id: headConsultant.consultant_id,
          consultant_specialization_topic: "Stress Management",
        },
      ],
      skipDuplicates: true,
    });

    headsByUni[uniCode] = { account: headAccount, consultant: headConsultant };
    console.log(`✅ Upserted ${username} for ${uniCode} (uni_id=${uni.university_id})`);
  }

  // MAP: university_id -> head account_id
  const headAccountIdByUniversityId = new Map<number, number>();
  for (const uniCode of Object.keys(headsByUni)) {
    const headAcc = headsByUni[uniCode]?.account;
    if (headAcc?.account_home_university_id && headAcc?.account_id) {
      headAccountIdByUniversityId.set(
        headAcc.account_home_university_id,
        headAcc.account_id,
      );
    }
  }

  console.log("🏛️ Upserting rector accounts (ALL universities)...");

  for (const uni of sortedUnis) {
    const uniCode = String(uni.university_code).toUpperCase();
    const username = `rector_${uniCode.toLowerCase()}`;

    await prisma.account.upsert({
      where: { account_username: username },
      create: {
        account_username: username,
        account_password: passwordHash,
        account_role: AccountRole.RECTOR,
        account_home_university_id: uni.university_id,
      },
      update: {
        account_password: passwordHash,
        account_role: AccountRole.RECTOR,
        account_home_university_id: uni.university_id,
      },
    });

    console.log(`✅ Upserted ${username} for ${uniCode} (uni_id=${uni.university_id})`);
  }

  console.log("🏛️ Upserting ministry account...");
  
  await prisma.account.upsert({
    where: { account_username: "ministry_admin" },
    create: {
      account_username: "ministry_admin",
      account_password: passwordHash,
      account_role: AccountRole.MINISTRY,
      account_home_university_id: null,
    },
    update: {
      account_password: passwordHash,
      account_role: AccountRole.MINISTRY,
      account_home_university_id: null,
    },
  });

  console.log("🛡️ Upserting super admin account...");

  const superAccount = await prisma.account.upsert({
    where: { account_username: "superAdmin" },
    create: {
      account_username: "superAdmin",
      account_password: passwordHash,
      account_role: AccountRole.SUPER_ADMIN,
      account_home_university_id: null,
    },
    update: {
      account_password: passwordHash,
      account_role: AccountRole.SUPER_ADMIN,
      account_home_university_id: null,
    },
  });

  return { headsByUni, headAccountIdByUniversityId, superAccount };
}
