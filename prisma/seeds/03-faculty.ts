import * as fs from "fs";
import * as path from "path";
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

  const { universities } = args;

  // =========================
  // LOAD CSV MAPPING (JSON)
  // =========================
  let universityCurriculum: Record<string, Record<string, string[]>> = {};
  try {
    const jsonPath = path.join(__dirname, "../seed-data/university-curriculum.json");
    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    universityCurriculum = JSON.parse(jsonContent);
    console.log(`   📂 Loaded curriculum data for ${Object.keys(universityCurriculum).length} universities`);
  } catch (error) {
    console.warn("   ⚠️  Could not load university-curriculum.json, falling back to DEFAULTS for all.", error);
  }

  // =========================
  // 0) Subject Group Categories (renamed from Education Field Groups)
  // =========================
  await prisma.subjectGroupCategory.createMany({
    data: educationFieldGroupsData.map((g) => ({
      isced_broad_field_code: g.isced_broad_field_code,
      field_group_name_th: g.field_group_name_th,
      field_group_name_en: g.field_group_name_en,
    })),
    skipDuplicates: true,
  });

  const groups = await prisma.subjectGroupCategory.findMany();
  const groupIdByIsc = new Map<string, number>(
    groups.map((g) => [g.isced_broad_field_code, g.subject_group_category_id])
  );

  // =========================
  // 1) FACULTIES
  // =========================
  const facultyByUniAndCode = new Map<string, Faculty>();
  let totalFacultiesCreated = 0;

  console.log(`   🏛️  Applying faculties to ${universities.length} universities (using CSV data where available)...`);

  for (const uni of universities) {
    // Determine which ISCED codes this university supports
    const uniSpecificData = universityCurriculum[uni.university_code];
    let facultiesToCreate = defaultFaculties;

    if (uniSpecificData) {
      // Filter default faculties to only those matching the university's ISCED codes
      const allowedIsced = Object.keys(uniSpecificData); 
      // Always include 'Generics' or specific ones if needed, but for now strictly filter
      facultiesToCreate = defaultFaculties.filter(f => 
        f.isced_broad_field_code && allowedIsced.includes(f.isced_broad_field_code)
      );
      
      // If filtering resulted in nothing (should be rare if uni is in JSON), fallback or keep empty?
      // Let's keep empty to respect the data, but warn.
      if (facultiesToCreate.length === 0) {
        // console.warn(`   ⚠️  Uni ${uni.university_code} is in JSON but has no matching faculties for its ISCED codes.`);
      }
    } else {
      // Fallback: Use all defaults for universities not in CSV
      // console.log(`   ℹ️  Uni ${uni.university_code} not in CSV, using ALL default faculties.`);
    }

    // Create faculties
    await prisma.faculty.createMany({
      data: facultiesToCreate.map((f) => ({
        university_id: uni.university_id,
        faculty_code: f.faculty_code,
        faculty_name_th: f.faculty_name_th,
        faculty_name_en: f.faculty_name_en ?? null,
        subject_group_category_id: f.isced_broad_field_code
          ? groupIdByIsc.get(f.isced_broad_field_code) ?? null
          : null,
      })),
      skipDuplicates: true,
    });

    // Fetch created faculties to map Ids
    const facs = await prisma.faculty.findMany({
      where: {
        university_id: uni.university_id,
        faculty_code: { in: facultiesToCreate.map((x) => x.faculty_code) },
      },
    });

    for (const fac of facs) {
      facultyByUniAndCode.set(`${uni.university_code}_${fac.faculty_code}`, fac);
    }

    totalFacultiesCreated += facs.length;
  }

  console.log(`   ✅ Created ${totalFacultiesCreated} faculties across ${universities.length} universities`);

  // =========================
  // 2) DEPARTMENTS
  // =========================
  const deptByUniAndCode = new Map<string, Department>();
  let totalDepartmentsCreated = 0;

  // We loop again or just do it in the same loop? Same loop is fine, but separation is cleaner for logic.
  // Actually, we can just process all departments now.
  
  // Optimization: Prepare data for createMany in chunks?
  // But we need to look up faculty_id per university.
  
  for (const uni of universities) {
    const data: Array<{
      university_id: number;
      faculty_id: number;
      department_code: string;
      department_name_th: string;
      department_name_en?: string | null;
    }> = [];

    // We only create departments for faculties that EXIST for this university
    for (const d of defaultDepartments) {
      const fac = facultyByUniAndCode.get(`${uni.university_code}_${d.faculty_code}`);
      
      // Skip if faculty wasn't created (filtered out)
      if (!fac) continue; 

      data.push({
        university_id: uni.university_id,
        faculty_id: fac.faculty_id,
        department_code: d.department_code,
        department_name_th: d.department_name_th,
        department_name_en: d.department_name_en ?? null,
      });
    }

    if (data.length > 0) {
      await prisma.department.createMany({
        data,
        skipDuplicates: true,
      });

      const depts = await prisma.department.findMany({
        where: {
          university_id: uni.university_id,
        },
      });

      for (const dep of depts) {
        deptByUniAndCode.set(`${uni.university_code}_${dep.department_code}`, dep);
      }
    }
    
    totalDepartmentsCreated += data.length;
  }
  
  console.log(`   ✅ Created ${totalDepartmentsCreated} departments`);
  console.log(`   🎓 Summary: ${universities.length} universities × faculties filtered by CSV`);

  return { facultyByUniAndCode, deptByUniAndCode };
}
