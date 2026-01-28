// prisma/seeds/03-faculty.ts
import { PrismaClient, type Faculty, type Department } from "@prisma/client";
import { FACULTIES, DEPARTMENTS } from "../seed-data/faculties";

export async function seedFacultiesDepartments(
  prisma: PrismaClient,
  args: { universities: Array<{ university_id: number }> },
) {
  console.log("🏛️  Creating faculties and departments...");

  const { universities } = args;

  const facultyByUniAndCode = new Map<string, Faculty>();
  const deptByUniAndCode = new Map<string, Department>();

  // =========================
  // 1) FACULTIES (rerun-safe)
  // =========================
  for (const uni of universities) {
    await prisma.faculty.createMany({
      data: FACULTIES.map((f) => ({
        university_id: uni.university_id,
        faculty_code: f.code,
        faculty_name_th: f.th,
        faculty_name_en: f.en,
      })),
      skipDuplicates: true,
    });

    // ดึงกลับมาสร้าง map
    const facs = await prisma.faculty.findMany({
      where: {
        university_id: uni.university_id,
        faculty_code: { in: FACULTIES.map((x) => x.code) },
      },
    });

    for (const fac of facs) {
      facultyByUniAndCode.set(`${uni.university_id}:${fac.faculty_code}`, fac);
    }
  }

  // =========================
  // 2) DEPARTMENTS (rerun-safe)
  // =========================
  for (const uni of universities) {
    const data: Array<{
      university_id: number;
      faculty_id: number;
      department_code: string;
      department_name_th: string;
      department_name_en?: string | null;
    }> = [];

    for (const d of DEPARTMENTS) {
      const fac = facultyByUniAndCode.get(`${uni.university_id}:${d.facultyCode}`);
      if (!fac) continue;

      data.push({
        university_id: uni.university_id,
        faculty_id: fac.faculty_id,
        department_code: d.code,
        department_name_th: d.th,
        department_name_en: d.en,
      });
    }

    await prisma.department.createMany({
      data,
      skipDuplicates: true,
    });

    const depts = await prisma.department.findMany({
      where: {
        university_id: uni.university_id,
        department_code: { in: DEPARTMENTS.map((x) => x.code) },
      },
    });

    for (const dep of depts) {
      deptByUniAndCode.set(`${uni.university_id}:${dep.department_code}`, dep);
    }
  }

  return { facultyByUniAndCode, deptByUniAndCode };
}
