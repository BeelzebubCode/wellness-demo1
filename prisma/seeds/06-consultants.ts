// prisma/seeds/06-consultants.ts
import { PrismaClient } from "@prisma/client";
import { firstNames, lastNames, nicknames } from "../seed-data/people";
import { languagePool, specializationPool } from "../seed-data/consultant-pools";

function hash32(str: string) {
  // FNV-1a 32-bit
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ✅ รับ readonly ได้ (แก้แดง TS)
function pickDeterministic<T>(arr: readonly T[], key: string, salt: string) {
  const idx = hash32(`${salt}:${key}`) % arr.length;
  return arr[idx];
}

// ✅ รับ readonly ได้ + คืน unique
function pickManyDeterministic<T>(
  arr: readonly T[],
  key: string,
  salt: string,
  count: number,
) {
  const picked: T[] = [];
  const used = new Set<number>();
  let k = 0;

  while (picked.length < count && used.size < arr.length) {
    const idx = hash32(`${salt}:${key}:${k}`) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      picked.push(arr[idx] as T);
    }
    k++;
  }
  return picked;
}

function biasFromUsername(username: string, forceLow?: boolean) {
  const r01 = (hash32(`bias:${username}`) % 10000) / 10000;

  if (forceLow) return 2.1 + r01 * 0.7; // 2.1-2.8 (Low: ~3 people)

  // Remaining ~17 people:
  // User wants ~8 High, ~9-10 Mid.
  // 8/17 is approx 0.47. Let's use 0.45 to be safe.
  if (r01 < 0.45) {
    const rTop = (hash32(`biasTop:${username}`) % 10000) / 10000;
    return 4.75 + rTop * 0.15; // 4.75-4.90 (High)
  }

  const rMid = (hash32(`biasMid:${username}`) % 10000) / 10000;
  return 3.5 + rMid * 1.0; // 3.5-4.5 (Mid)
}

// helper: แปลง pool ให้เป็น Array ชัวร์ ๆ
function toArray<T>(x: any): T[] {
  if (Array.isArray(x)) return x as T[];
  // รองรับกรณีเป็น Set
  if (x && typeof x[Symbol.iterator] === "function") return Array.from(x) as T[];
  return [];
}

export async function seedConsultants(
  prisma: PrismaClient,
  args: { universities: any[]; org: any; passwordHash: string },
) {
  console.log("💼 Upserting consultants...");

  const { universities, org, passwordHash } = args;

  // ✅ ทำให้เป็น array ธรรมดา ป้องกัน readonly/Set type issue
  const langArr = toArray<{ code: string; level: any }>(languagePool);
  const specArr = toArray<any>(specializationPool);

  const consultants: any[] = [];
  const consultantBiasById = new Map<number, number>();

  let lowPerformerLeft = 3;
  const PER_UNI = 20;

  for (const uni of universities) {
    const uniCodeRaw = String(uni.university_code);
    const uniCode = uniCodeRaw.toLowerCase();

    for (let i = 0; i < PER_UNI; i++) {
      const username = `consultant_${uniCode}_${i + 1}`;

      const acc = await prisma.account.upsert({
        where: { account_username: username },
        create: {
          account_username: username,
          account_password: passwordHash,
          account_role_id: 2, // CONSULTANT
          account_home_university_id: uni.university_id,
        },
        update: {
          account_password: passwordHash,
          account_role_id: 2, // CONSULTANT
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

      // ✅ profile deterministic (rerun แล้วไม่เปลี่ยน)
      const fname = pickDeterministic(firstNames, username, "fname");
      const lname = pickDeterministic(lastNames, username, "lname");
      const nname = pickDeterministic(nicknames, username, "nick");
      const gender = (hash32(`gender:${username}`) % 2) === 0 ? "MALE" : "FEMALE";
      const phoneTail = String(hash32(`phone:${username}`) % 100000000).padStart(8, "0");

      await prisma.consultantProfile.upsert({
        where: { consultant_id: consultant.consultant_id },
        create: {
          consultant_id: consultant.consultant_id,
          consultant_first_name: fname,
          consultant_last_name: lname,
          consultant_nickname: nname,
          consultant_email: `${username}@${uniCode}.ac.th`,
          consultant_gender: gender as any,
          consultant_phone_number: `08${phoneTail}`,
        },
        update: {
          consultant_first_name: fname,
          consultant_last_name: lname,
          consultant_nickname: nname,
          consultant_email: `${username}@${uniCode}.ac.th`,
        },
      });

      // =========================
      // languages 1-2 (deterministic + rerun-safe)
      // =========================
      const langCount = 1 + (hash32(`langCount:${username}`) % 2); // 1-2
      const pickedLangs = pickManyDeterministic(langArr, username, "langPick", langCount);

      await prisma.consultantLanguage.createMany({
        data: pickedLangs.map((l) => ({
          consultant_id: consultant.consultant_id,
          consultant_language_code: l.code,
          consultant_language_fluency_level: l.level,
        })),
        skipDuplicates: true,
      });

      // =========================
      // specializations 1-2 (deterministic + rerun-safe)
      // =========================
      const specCount = 1 + (hash32(`specCount:${username}`) % 2); // 1-2
      const pickedSpecs = pickManyDeterministic(specArr, username, "specPick", specCount);

      await prisma.consultantSpecialization.createMany({
        data: pickedSpecs.map((s) => ({
          consultant_id: consultant.consultant_id,
          consultant_specialization_topic: (s as any).th ?? String(s),
        })),
        skipDuplicates: true,
      });

      // =========================
      // bias per consultant (deterministic)
      // =========================
      const forceLow = lowPerformerLeft > 0;
      const bias = biasFromUsername(username, forceLow);
      if (forceLow) lowPerformerLeft--;

      consultantBiasById.set(consultant.consultant_id, bias);
      consultants.push(consultant);
    }
  }

  return { consultants, consultantBiasById };
}
