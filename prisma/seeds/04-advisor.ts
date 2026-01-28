// prisma/seeds/04-advisor.ts
import { PrismaClient, type Advisor } from "@prisma/client";
import { DEPARTMENTS } from "../seed-data/faculties";
import { firstNames, lastNames } from "../seed-data/people";
import { randomInt, randomItem } from "../seed-utils/rand";

export async function seedAdvisors(
  prisma: PrismaClient,
  args: {
    universities: any[];
    facultyByUniAndCode: Map<string, any>;
    deptByUniAndCode: Map<string, any>;
  },
) {
  console.log("👨‍🏫 Creating advisors...");

  const { universities, facultyByUniAndCode, deptByUniAndCode } = args;

  const advisors: Advisor[] = [];

  for (const uni of universities) {
    const uniCode = String(uni.university_code).toLowerCase();

    for (const d of DEPARTMENTS) {
      const fac = facultyByUniAndCode.get(`${uni.university_id}:${d.facultyCode}`);
      const dep = deptByUniAndCode.get(`${uni.university_id}:${d.code}`);
      if (!fac || !dep) continue;

      const email = `advisor_${uniCode}_${String(d.code).toLowerCase()}@university.ac.th`;

      const existing = await prisma.advisor.findFirst({
        where: { advisor_email: email },
      });

      const data = {
        university_id: uni.university_id,
        faculty_id: fac.faculty_id,
        department_id: dep.department_id,
        advisor_academic_rank: randomItem(["Asst. Prof.", "Assoc. Prof.", "Lecturer"]),
        advisor_prefix: randomItem(["ดร.", "ผศ.ดร.", "อ."]) as any,
        advisor_first_name: randomItem(firstNames),
        advisor_last_name: randomItem(lastNames),
        advisor_email: email,
        advisor_phone_number: `0${randomInt(800000000, 899999999)}`,
        advisor_office_location: `Building ${randomItem(["A", "B", "C", "D"])}, Room ${randomInt(101, 499)}`,
      };

      const createdOrUpdated = existing
        ? await prisma.advisor.update({
            where: { advisor_id: existing.advisor_id },
            data: {
              // update เฉพาะ field ที่อยากให้เปลี่ยนตอน rerun
              advisor_academic_rank: data.advisor_academic_rank,
              advisor_first_name: data.advisor_first_name,
              advisor_last_name: data.advisor_last_name,
              advisor_phone_number: data.advisor_phone_number,
              advisor_office_location: data.advisor_office_location,
              // ถ้าอยาก “ล็อกความสัมพันธ์” ก็ปล่อย 3 ตัวนี้ไว้ได้
              university_id: data.university_id,
              faculty_id: data.faculty_id,
              department_id: data.department_id,
            },
          })
        : await prisma.advisor.create({ data });

      advisors.push(createdOrUpdated);
    }
  }

  return advisors;
}
