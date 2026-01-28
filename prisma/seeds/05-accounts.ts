// prisma/seeds/05-accounts.ts
import { PrismaClient, AccountRole } from "@prisma/client";
import { randomInt, randomItem } from "../seed-utils/rand";

export async function seedAccounts(
  prisma: PrismaClient,
  args: { universities: any[]; org: any; passwordHash: string },
) {
  const { universities, org, passwordHash } = args;

  console.log("👑 Upserting head accounts (NU/KKU/CU)...");

  const headsByUni: Record<string, { account: any; consultant: any }> = {};
  const targetHeadUnis = universities.filter((u) => ["NU", "KKU", "CU"].includes(u.university_code));

  for (const uni of targetHeadUnis) {
    const username = `head_${uni.university_code.toLowerCase()}`;

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
        consultant_last_name: uni.university_code,
        consultant_nickname: "Boss",
        consultant_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
        consultant_gender: randomItem(["MALE", "FEMALE"]) as any,
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
      update: {
        consultant_first_name: "Head",
        consultant_last_name: uni.university_code,
        consultant_nickname: "Boss",
        consultant_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
      },
    });

    await prisma.consultantLanguage.createMany({
      data: [
        { consultant_id: headConsultant.consultant_id, consultant_language_code: "TH", consultant_language_fluency_level: "NATIVE" },
        { consultant_id: headConsultant.consultant_id, consultant_language_code: "EN", consultant_language_fluency_level: "GOOD" },
      ],
      skipDuplicates: true,
    });

    await prisma.consultantSpecialization.createMany({
      data: [
        { consultant_id: headConsultant.consultant_id, consultant_specialization_topic: "Academic Counseling" },
        { consultant_id: headConsultant.consultant_id, consultant_specialization_topic: "Stress Management" },
      ],
      skipDuplicates: true,
    });

    headsByUni[uni.university_code] = { account: headAccount, consultant: headConsultant };
    console.log(`✅ Upserted ${username} for ${uni.university_code}`);
  }

  // MAP: university_id -> head account_id
  const headAccountIdByUniversityId = new Map<number, number>();
  for (const uniCode of Object.keys(headsByUni)) {
    const headAcc = headsByUni[uniCode]?.account;
    if (headAcc?.account_home_university_id && headAcc?.account_id) {
      headAccountIdByUniversityId.set(headAcc.account_home_university_id, headAcc.account_id);
    }
  }

  // Rector
  console.log("🏛️ Upserting rector accounts (NU/KKU/CU)...");

  const rectorTargets = universities.filter((u) => ["NU", "KKU", "CU"].includes(u.university_code));
  for (const uni of rectorTargets) {
    const username = `rector_${uni.university_code.toLowerCase()}`;

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

    console.log(`✅ Upserted ${username} for ${uni.university_code}`);
  }

  // Super Admin
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
