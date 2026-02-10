// seeds/03-faculty.ts
import {
  PrismaClient,
  type Faculty,
  type Department,
} from "@prisma/client";

import { educationFieldGroupsData } from "../seed-data/education-field-groups";
import { defaultFaculties, defaultDepartments } from "../seed-data/default-faculties";

type UniLite = { university_id: number; university_code: string };

export async function seedFacultiesDepartments(
  prisma: PrismaClient,
  args: { universities: UniLite[] }
) {
  console.log("🏛️  Creating education field groups, faculties and departments...");
  console.log("   📌 Using DEFAULT faculty structure for ALL universities");

  const { universities } = args;

  // =========================
  // 0) EDUCATION FIELD GROUPS (global, rerun-safe)
  // =========================
  await prisma.educationFieldGroup.createMany({
    data: educationFieldGroupsData.map((g) => ({
      isced_broad_field_code: g.isced_broad_field_code,
      field_group_name_th: g.field_group_name_th,
      field_group_name_en: g.field_group_name_en,
    })),
    skipDuplicates: true,
  });

  const groups = await prisma.educationFieldGroup.findMany();
  const groupIdByIsc = new Map<string, number>(
    groups.map((g) => [g.isced_broad_field_code, g.education_field_group_id])
  );

  // =========================
  // 1) FACULTIES (DEFAULT for ALL universities)
  // =========================
  const facultyByUniAndCode = new Map<string, Faculty>();
  let totalFacultiesCreated = 0;

  console.log(`   🏛️  Applying ${defaultFaculties.length} default faculties to ${universities.length} universities...`);

  for (const uni of universities) {
    // Create all default faculties for this university
    await prisma.faculty.createMany({
      data: defaultFaculties.map((f) => ({
        university_id: uni.university_id,
        faculty_code: f.faculty_code,
        faculty_name_th: f.faculty_name_th,
        faculty_name_en: f.faculty_name_en ?? null,
        education_field_group_id: f.isced_broad_field_code
          ? groupIdByIsc.get(f.isced_broad_field_code) ?? null
          : null,
      })),
      skipDuplicates: true,
    });

    // Fetch created faculties
    const facs = await prisma.faculty.findMany({
      where: {
        university_id: uni.university_id,
        faculty_code: { in: defaultFaculties.map((x) => x.faculty_code) },
      },
    });

    // Index them
    for (const fac of facs) {
      facultyByUniAndCode.set(`${uni.university_code}_${fac.faculty_code}`, fac);
    }

    totalFacultiesCreated += facs.length;
  }

  console.log(`   ✅ Created ${totalFacultiesCreated} faculties (${defaultFaculties.length} per university)`);

  // =========================
  // 2) DEPARTMENTS (DEFAULT for ALL universities)
  // =========================
  const deptByUniAndCode = new Map<string, Department>();
  let totalDepartmentsCreated = 0;

  console.log(`   📚 Applying ${defaultDepartments.length} default departments to ${universities.length} universities...`);

  for (const uni of universities) {
    const data: Array<{
      university_id: number;
      faculty_id: number;
      department_code: string;
      department_name_th: string;
      department_name_en?: string | null;
    }> = [];

    for (const d of defaultDepartments) {
      const fac = facultyByUniAndCode.get(`${uni.university_code}_${d.faculty_code}`);
      if (!fac) {
        console.warn(`   ⚠️  Faculty ${d.faculty_code} not found for ${uni.university_code}`);
        continue;
      }

      data.push({
        university_id: uni.university_id,
        faculty_id: fac.faculty_id,
        department_code: d.department_code,
        department_name_th: d.department_name_th,
        department_name_en: d.department_name_en ?? null,
      });
    }

    await prisma.department.createMany({
      data,
      skipDuplicates: true,
    });

    const depts = await prisma.department.findMany({
      where: {
        university_id: uni.university_id,
        department_code: { in: defaultDepartments.map((x) => x.department_code) },
      },
    });

    for (const dep of depts) {
      deptByUniAndCode.set(`${uni.university_code}_${dep.department_code}`, dep);
    }

    totalDepartmentsCreated += depts.length;
  }

  console.log(`   ✅ Created ${totalDepartmentsCreated} departments (${defaultDepartments.length} per university)`);
  console.log(`   🎓 Summary: ${universities.length} universities × ${defaultFaculties.length} faculties × ~${Math.round(defaultDepartments.length / defaultFaculties.length)} depts/faculty`);

  return { facultyByUniAndCode, deptByUniAndCode };
}
