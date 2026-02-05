// prisma/seeds/04-advisor.ts
import { PrismaClient, type Advisor, AccountRole } from "@prisma/client";
import { departmentsData } from "../seed-data/departments";
import { firstNames, lastNames } from "../seed-data/people";

// ... (helper functions keep same)
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
    facultyByUniAndCode: Map<string, any>;
    deptByUniAndCode: Map<string, any>;
    passwordHash: string;
  },
) {
  console.log("👨‍🏫 Upserting advisors...");

  const { universities, facultyByUniAndCode, deptByUniAndCode, passwordHash } = args;

  const advisors: Advisor[] = [];

  // pools
  const ranks = ["Asst. Prof.", "Assoc. Prof.", "Lecturer"] as const;
  const prefixes = ["ดร.", "ผศ.ดร.", "อ."] as const;
  const buildings = ["A", "B", "C", "D"] as const;

  for (const uni of universities) {
    const uniCode = String(uni.university_code);
    const uniCodeLower = uniCode.toLowerCase();

    // ✅ ใช้ departmentsData ของใหม่ (กรองตามมหาลัย)
    const deptSeeds = departmentsData.filter(
      (d) => String(d.university_code).toUpperCase() === uniCode.toUpperCase(),
    );

    for (const d of deptSeeds) {
      // ✅ key ต้องตรงกับที่ 03-faculty.ts set ไว้
      const fac = facultyByUniAndCode.get(
        `${uni.university_id}:${d.faculty_code}`,
      );
      const dep = deptByUniAndCode.get(
        `${uni.university_id}:${d.department_code}`,
      );

      if (!fac || !dep) continue;

      const email = `advisor_${uniCodeLower}_${String(d.department_code).toLowerCase()}@${uniCodeLower}.ac.th`;
      const username = email.split("@")[0]; // Use prefix as username

      // 1. Create Account
      const account = await prisma.account.upsert({
        where: { account_username: username },
        create: {
          account_username: username,
          account_password: passwordHash,
          account_role: AccountRole.ADVISOR,
          account_home_university_id: uni.university_id,
        },
        update: {
            account_password: passwordHash,
            account_role: AccountRole.ADVISOR,
        }
      });

      // deterministic fields (rerun แล้วเหมือนเดิม)
      const advisor_academic_rank = pickDeterministic(ranks, email, "rank");
      const advisor_prefix = pickDeterministic(prefixes, email, "prefix") as any;
      const advisor_first_name = pickDeterministic(firstNames, email, "fname");
      const advisor_last_name = pickDeterministic(lastNames, email, "lname");
      const advisor_phone_number = `0${randRangeDeterministic(
        email,
        "phone",
        800000000,
        899999999,
      )}`;
      const advisor_office_location = `Building ${pickDeterministic(
        buildings,
        email,
        "bld",
      )}, Room ${randRangeDeterministic(email, "room", 101, 499)}`;

      const data = {
        university_id: uni.university_id,
        faculty_id: fac.faculty_id,
        department_id: dep.department_id,
        advisor_academic_rank,
        advisor_prefix,
        advisor_first_name,
        advisor_last_name,
        advisor_email: email,
        advisor_phone_number,
        advisor_office_location,
        account_id: account.account_id, // Link to Account
      };

      const createdOrUpdated = await prisma.advisor.upsert({
        where: { advisor_email: email }, // ต้องมี advisor_email @unique (ของคุณมีแล้ว)
        create: data,
        update: {
          advisor_academic_rank: data.advisor_academic_rank,
          advisor_first_name: data.advisor_first_name,
          advisor_last_name: data.advisor_last_name,
          advisor_phone_number: data.advisor_phone_number,
          advisor_office_location: data.advisor_office_location,
          university_id: data.university_id,
          faculty_id: data.faculty_id,
          department_id: data.department_id,
          account_id: data.account_id,
        },
      });

      advisors.push(createdOrUpdated);
    }
  }

  return advisors;
}
