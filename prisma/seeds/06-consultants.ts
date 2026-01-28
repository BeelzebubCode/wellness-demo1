// prisma/seeds/06-consultants.ts
import { PrismaClient, AccountRole } from "@prisma/client";
import { firstNames, lastNames, nicknames } from "../seed-data/people";
import { languagePool, specializationPool } from "../seed-data/consultant-pools";
import { randomInt, randomItem } from "../seed-utils/rand";

export async function seedConsultants(
  prisma: PrismaClient,
  args: { universities: any[]; org: any; passwordHash: string },
) {
  console.log("💼 Upserting consultants...");

  const { universities, org, passwordHash } = args;

  const consultants: any[] = [];
  const consultantBiasById = new Map<number, number>(); // consultant_id -> base mean

  let lowPerformerLeft = 3;

  for (const uni of universities) {
    for (let i = 0; i < 5; i++) {
      const uniCode = String(uni.university_code).toLowerCase();
      const username = `consultant_${uniCode}_${i + 1}`;

      const acc = await prisma.account.upsert({
        where: { account_username: username },
        create: {
          account_username: username,
          account_password: passwordHash,
          account_role: AccountRole.CONSULTANT,
          account_home_university_id: uni.university_id,
        },
        update: {
          account_password: passwordHash,
          account_role: AccountRole.CONSULTANT,
          account_home_university_id: uni.university_id,
        },
      });

      const consultant = await prisma.consultant.upsert({
        where: { account_id: acc.account_id },
        create: {
          account_id: acc.account_id,
          university_id: uni.university_id,
          organization_id: org.organization_id,
        },
        update: {
          university_id: uni.university_id,
          organization_id: org.organization_id,
        },
      });

      const fname = randomItem(firstNames);
      const lname = randomItem(lastNames);

      await prisma.consultantProfile.upsert({
        where: { consultant_id: consultant.consultant_id },
        create: {
          consultant_id: consultant.consultant_id,
          consultant_first_name: fname,
          consultant_last_name: lname,
          consultant_nickname: randomItem(nicknames),
          consultant_email: `${username}@${uniCode}.ac.th`,
          consultant_gender: randomItem(["MALE", "FEMALE"]) as any,
          consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
        },
        update: {
          consultant_first_name: fname,
          consultant_last_name: lname,
          consultant_nickname: randomItem(nicknames),
          consultant_email: `${username}@${uniCode}.ac.th`,
        },
      });

      // =========================
      // languages 1-2 (rerun-safe)
      // =========================
      const langCount = randomInt(1, 2);
      const pickedLangCodes = Array.from(
        new Set(
          Array.from({ length: langCount }, () => randomItem(languagePool).code),
        ),
      );

      await prisma.consultantLanguage.createMany({
        data: pickedLangCodes.map((code) => {
          const l = languagePool.find((x) => x.code === code)!;
          return {
            consultant_id: consultant.consultant_id,
            consultant_language_code: l.code,
            consultant_language_fluency_level: l.level,
          };
        }),
        skipDuplicates: true,
      });

      // =========================
      // specializations 1-2 (rerun-safe)
      // =========================
      const specCount = randomInt(1, 2);
      const pickedSpecs = Array.from(
        new Set(
          Array.from({ length: specCount }, () =>
            randomItem([...specializationPool]),
          ),
        ),
      );

      await prisma.consultantSpecialization.createMany({
        data: pickedSpecs.map((s) => ({
          consultant_id: consultant.consultant_id,
          consultant_specialization_topic: (s as any).th ?? String(s),
        })),
        skipDuplicates: true,
      });

      // =========================
      // bias per consultant
      // =========================
      let bias: number;

      if (lowPerformerLeft > 0) {
        // ✅ 3 คนแรก "ต่ำกว่า 3" แน่นอน
        bias = 2.1 + Math.random() * 0.7; // 2.1 - 2.8
        lowPerformerLeft--;
      } else {
        bias =
          Math.random() < 0.15
            ? 4.75 + Math.random() * 0.15 // 4.75-4.90
            : 3.9 + Math.random() * 0.9; // 3.9-4.8
      }

      consultantBiasById.set(consultant.consultant_id, bias);
      consultants.push(consultant);
    }
  }

  return { consultants, consultantBiasById };
}
