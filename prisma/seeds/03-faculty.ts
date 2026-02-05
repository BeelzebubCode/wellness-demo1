// seeds/03-faculty.ts
import {
  PrismaClient,
  type Faculty,
  type Department,
} from "@prisma/client";

import { educationFieldGroupsData } from "../seed-data/education-field-groups";
import { facultiesData } from "../seed-data/faculties";
import { departmentsData } from "../seed-data/departments";

type UniLite = { university_id: number; university_code: string };

export async function seedFacultiesDepartments(
  prisma: PrismaClient,
  args: { universities: UniLite[] }
) {
  console.log("🏛️  Creating education field groups, faculties and departments...");

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
  // 1) FACULTIES (per-university, rerun-safe)
  // =========================
  const facultyByUniAndCode = new Map<string, Faculty>();

  for (const uni of universities) {
    const facSeeds = facultiesData.filter(
      (f) => f.university_code === uni.university_code
    );

    await prisma.faculty.createMany({
      data: facSeeds.map((f) => ({
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

    const facs = await prisma.faculty.findMany({
      where: {
        university_id: uni.university_id,
        faculty_code: { in: facSeeds.map((x) => x.faculty_code) },
      },
    });

    for (const fac of facs) {
      facultyByUniAndCode.set(`${uni.university_id}:${fac.faculty_code}`, fac);
    }
  }

  // =========================
  // 2) DEPARTMENTS (per-university, rerun-safe)
  // =========================
  const deptByUniAndCode = new Map<string, Department>();

  for (const uni of universities) {
    const deptSeeds = departmentsData.filter(
      (d) => d.university_code === uni.university_code
    );

    const data: Array<{
      university_id: number;
      faculty_id: number;
      department_code: string;
      department_name_th: string;
      department_name_en?: string | null;
    }> = [];

    for (const d of deptSeeds) {
      const fac = facultyByUniAndCode.get(`${uni.university_id}:${d.faculty_code}`);
      if (!fac) continue;

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
        department_code: { in: deptSeeds.map((x) => x.department_code) },
      },
    });

    for (const dep of depts) {
      deptByUniAndCode.set(`${uni.university_id}:${dep.department_code}`, dep);
    }

    // ✅ FIX: สร้าง default department ถ้ามหาลัยไม่มีสาขาเลย
    if (depts.length === 0) {
      console.log(`   ⚠️  ${uni.university_code} has no departments. Creating default department...`);
      
      // สร้าง default faculty ก่อน
      const defaultFaculty = await prisma.faculty.create({
        data: {
          university_id: uni.university_id,
          faculty_code: "GEN",
          faculty_name_th: "คณะทั่วไป",
          faculty_name_en: "General Faculty",
          education_field_group_id: null,
        },
      });

      // สร้าง default department
      const defaultDept = await prisma.department.create({
        data: {
          university_id: uni.university_id,
          faculty_id: defaultFaculty.faculty_id,
          department_code: "GEN",
          department_name_th: "สาขาทั่วไป",
          department_name_en: "General Department",
        },
      });

      deptByUniAndCode.set(`${uni.university_id}:GEN`, defaultDept);
      facultyByUniAndCode.set(`${uni.university_id}:GEN`, defaultFaculty);
    }
  }

  return { facultyByUniAndCode, deptByUniAndCode };
}
