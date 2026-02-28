// scripts/backfill-realistic-data.ts
// 🚀 SQL-only backfill for realistic student data
// Run: npx tsx scripts/backfill-realistic-data.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting realistic data backfill...\n");

    // ====================================================
    // STEP 1: Expand admit years to 7 years (2562-2568)
    // Currently only 2565-2568. Need 2562, 2563, 2564
    // ====================================================
    console.log("📅 STEP 1: Expanding admit years (2562-2564)...");

    // Randomly reassign ~30% of students to years 2562-2564
    // Those admitted 2562-2564 will be marked GRADUATED later
    await prisma.$executeRaw`
    UPDATE student_academic
    SET student_admit_academic_year = 
      CASE 
        WHEN random() < 0.12 THEN 2562
        WHEN random() < 0.25 THEN 2563
        WHEN random() < 0.40 THEN 2564
        ELSE student_admit_academic_year
      END
    WHERE student_admit_academic_year IS NOT NULL
  `;

    const yearDist = await prisma.$queryRaw<any[]>`
    SELECT student_admit_academic_year, COUNT(*)::int as cnt
    FROM student_academic
    GROUP BY student_admit_academic_year
    ORDER BY student_admit_academic_year
  `;
    console.log("  Distribution:");
    console.table(yearDist);

    // ====================================================
    // STEP 2: Education Level distribution
    // Bachelor ~85%, Master ~10%, Doctorate ~5%
    // ====================================================
    console.log("🎓 STEP 2: Setting education levels...");

    await prisma.$executeRaw`
    UPDATE student_academic
    SET education_level = 
      CASE 
        WHEN random() < 0.85 THEN 'BACHELOR'
        WHEN random() < 0.95 THEN 'MASTER'
        ELSE 'DOCTORATE'
      END::\"EducationLevel\",
    student_degree = 
      CASE 
        WHEN random() < 0.85 THEN 'Bachelor'
        WHEN random() < 0.95 THEN 'Master'
        ELSE 'Doctorate'
      END,
    student_degree_name = 
      CASE 
        WHEN random() < 0.85 THEN 'Bachelor Degree'
        WHEN random() < 0.95 THEN 'Master Degree'
        ELSE 'Doctoral Degree'
      END
  `;

    // Fix: education_level should match student_degree
    await prisma.$executeRaw`
    UPDATE student_academic
    SET education_level = 
      CASE student_degree
        WHEN 'Bachelor' THEN 'BACHELOR'
        WHEN 'Master' THEN 'MASTER'
        WHEN 'Doctorate' THEN 'DOCTORATE'
        ELSE 'BACHELOR'
      END::\"EducationLevel\"
  `;

    const eduDist = await prisma.$queryRaw<any[]>`
    SELECT education_level, COUNT(*)::int FROM student_academic GROUP BY education_level ORDER BY count DESC
  `;
    console.table(eduDist);

    // ====================================================
    // STEP 3: Program duration + expected graduation
    // Bachelor=4yr, Master=2yr, Doctorate=4yr
    // Med/Dent=6yr, Pharm/Arch=5yr
    // ====================================================
    console.log("📐 STEP 3: Setting program duration & expected graduation...");

    await prisma.$executeRaw`
    UPDATE student_academic sa
    SET 
      program_duration_years = CASE
        WHEN sa.education_level = 'DOCTORATE' THEN 4
        WHEN sa.education_level = 'MASTER' THEN 2
        ELSE CASE
          WHEN d.department_name_en ILIKE '%medic%' OR d.department_name_en ILIKE '%dent%' 
               OR d.department_name_th LIKE '%แพทย%' OR d.department_name_th LIKE '%ทันต%' THEN 6
          WHEN d.department_name_en ILIKE '%pharm%' OR d.department_name_en ILIKE '%architect%'
               OR d.department_name_th LIKE '%เภสัช%' OR d.department_name_th LIKE '%สถาปัตย%' THEN 5
          ELSE 4
        END
      END,
      expected_graduation_year = sa.student_admit_academic_year + CASE
        WHEN sa.education_level = 'DOCTORATE' THEN 4
        WHEN sa.education_level = 'MASTER' THEN 2
        ELSE CASE
          WHEN d.department_name_en ILIKE '%medic%' OR d.department_name_en ILIKE '%dent%' 
               OR d.department_name_th LIKE '%แพทย%' OR d.department_name_th LIKE '%ทันต%' THEN 6
          WHEN d.department_name_en ILIKE '%pharm%' OR d.department_name_en ILIKE '%architect%'
               OR d.department_name_th LIKE '%เภสัช%' OR d.department_name_th LIKE '%สถาปัตย%' THEN 5
          ELSE 4
        END
      END
    FROM department d
    WHERE sa.department_id = d.department_id AND sa.university_id = d.university_id
  `;

    const durDist = await prisma.$queryRaw<any[]>`
    SELECT program_duration_years, education_level, COUNT(*)::int 
    FROM student_academic GROUP BY program_duration_years, education_level 
    ORDER BY program_duration_years, education_level
  `;
    console.table(durDist);

    // ====================================================
    // STEP 4: Student status — GRADUATED for those past expected grad year
    // Current year = 2568
    // ====================================================
    console.log("🎓 STEP 4: Setting graduation status...");

    const gradStatusId = await prisma.studentStatus.findFirst({
        where: { student_status_code: "GRADUATED" },
    });
    const droppedStatusId = await prisma.studentStatus.findFirst({
        where: { student_status_code: "DROPPED_OUT" },
    });
    const onLeaveStatusId = await prisma.studentStatus.findFirst({
        where: { student_status_code: "ON_LEAVE" },
    });
    const activeStatusId = await prisma.studentStatus.findFirst({
        where: { student_status_code: "ACTIVE" },
    });

    if (!gradStatusId || !droppedStatusId || !onLeaveStatusId || !activeStatusId) {
        throw new Error("Missing student status codes");
    }

    // Students who should have graduated (expected_graduation_year <= 2568)
    const graduated = await prisma.$executeRaw`
    UPDATE student s
    SET student_status_id = ${gradStatusId.student_status_id}
    FROM student_academic sa
    WHERE s.student_id = sa.student_id
      AND s.university_id = sa.university_id
      AND sa.expected_graduation_year IS NOT NULL
      AND sa.expected_graduation_year <= 2568
  `;
    console.log(`  GRADUATED: ${graduated} students`);

    // Among active students, ~3% DROPPED_OUT, ~2% ON_LEAVE  
    const dropped = await prisma.$executeRaw`
    UPDATE student
    SET student_status_id = ${droppedStatusId.student_status_id}
    WHERE student_status_id = ${activeStatusId.student_status_id}
      AND random() < 0.03
  `;
    console.log(`  DROPPED_OUT: ${dropped} students`);

    const onLeave = await prisma.$executeRaw`
    UPDATE student
    SET student_status_id = ${onLeaveStatusId.student_status_id}
    WHERE student_status_id = ${activeStatusId.student_status_id}
      AND random() < 0.02
  `;
    console.log(`  ON_LEAVE: ${onLeave} students`);

    const statusDist = await prisma.$queryRaw<any[]>`
    SELECT ss.student_status_code, COUNT(s.student_id)::int as cnt
    FROM student s JOIN student_status ss ON s.student_status_id = ss.student_status_id
    GROUP BY ss.student_status_code ORDER BY cnt DESC
  `;
    console.table(statusDist);

    // ====================================================
    // STEP 5: Country + nationality (90% Thai, 10% international)
    // ====================================================
    console.log("🌍 STEP 5: Setting country/nationality...");

    const thCountry = await prisma.country.findFirst({
        where: { country_code_alpha2: "TH" },
    });

    if (!thCountry) throw new Error("Thailand country not found");

    // 90% Thai  
    await prisma.$executeRaw`
    UPDATE student_profile
    SET country_id = ${thCountry.country_id},
        student_nationality = 'ไทย'
    WHERE random() < 0.90 AND country_id IS NULL
  `;

    // International students: distribute among other countries
    const intlCountries = await prisma.country.findMany({
        where: { nationality_type: "INTERNATIONAL" },
    });

    for (const country of intlCountries) {
        await prisma.$executeRaw`
      UPDATE student_profile
      SET country_id = ${country.country_id},
          student_nationality = ${country.country_name_th}
      WHERE country_id IS NULL
        AND random() < ${1.0 / (intlCountries.length * 0.5)}
    `;
    }

    // Remaining nulls → rest of international countries
    await prisma.$executeRaw`
    UPDATE student_profile
    SET country_id = (
      SELECT country_id FROM country 
      WHERE nationality_type = 'INTERNATIONAL' 
      ORDER BY random() LIMIT 1
    ),
    student_nationality = 'ต่างชาติ'
    WHERE country_id IS NULL
  `;

    // International students should be in "International Program"
    await prisma.$executeRaw`
    UPDATE student_academic sa
    SET student_program = 'International Program'
    FROM student_profile sp
    WHERE sa.student_id = sp.student_id 
      AND sa.university_id = sp.university_id
      AND sp.country_id != ${thCountry.country_id}
  `;

    const countryDist = await prisma.$queryRaw<any[]>`
    SELECT c.country_name_en, c.nationality_type, COUNT(*)::int as cnt
    FROM student_profile sp JOIN country c ON sp.country_id = c.country_id
    GROUP BY c.country_name_en, c.nationality_type 
    ORDER BY cnt DESC LIMIT 15
  `;
    console.table(countryDist);

    // ====================================================
    // STEP 6: Fix duplicate names — append suffixes
    // ====================================================
    console.log("📝 STEP 6: Fixing duplicate names...");

    // Add Thai suffix patterns to make names unique
    const suffixes = [
        "กุล", "พร", "ศรี", "รัตน์", "วัฒน์", "ชัย",
        "ลักษณ์", "สิริ", "ภัทร", "ธร", "พงศ์", "วิทย์",
        "นันท์", "พันธ์", "เดช", "ภูมิ", "เม", "อร",
        "มงคล", "ธิดา", "ณัฐ", "พิศ", "จิตร", "กานต์"
    ];

    // Use window functions to number duplicates and append suffix
    await prisma.$executeRaw`
    WITH numbered AS (
      SELECT student_id, university_id,
             student_first_name_th,
             student_last_name_th,
             ROW_NUMBER() OVER (
               PARTITION BY student_first_name_th, student_last_name_th 
               ORDER BY student_id
             ) as rn
      FROM student_profile
    )
    UPDATE student_profile sp
    SET student_last_name_th = sp.student_last_name_th || 
      CASE (n.rn % 24)
        WHEN 1 THEN 'กุล'    WHEN 2 THEN 'พร'     WHEN 3 THEN 'ศรี'
        WHEN 4 THEN 'รัตน์'   WHEN 5 THEN 'วัฒน์'   WHEN 6 THEN 'ชัย'
        WHEN 7 THEN 'ลักษณ์'  WHEN 8 THEN 'สิริ'    WHEN 9 THEN 'ภัทร'
        WHEN 10 THEN 'ธร'    WHEN 11 THEN 'พงศ์'   WHEN 12 THEN 'วิทย์'
        WHEN 13 THEN 'นันท์'  WHEN 14 THEN 'พันธ์'  WHEN 15 THEN 'เดช'
        WHEN 16 THEN 'ภูมิ'   WHEN 17 THEN 'เม'    WHEN 18 THEN 'อร'
        WHEN 19 THEN 'มงคล'  WHEN 20 THEN 'ธิดา'   WHEN 21 THEN 'ณัฐ'
        WHEN 22 THEN 'พิศ'   WHEN 23 THEN 'จิตร'   ELSE 'กานต์'
      END
    FROM numbered n
    WHERE sp.student_id = n.student_id 
      AND sp.university_id = n.university_id
      AND n.rn > 1
  `;

    const nameDups = await prisma.$queryRaw<any[]>`
    SELECT student_first_name_th, student_last_name_th, COUNT(*)::int as cnt
    FROM student_profile
    GROUP BY student_first_name_th, student_last_name_th
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC LIMIT 10
  `;
    console.log("  Top remaining duplicates (first+last):");
    console.table(nameDups);

    // ====================================================
    // STEP 7: Backfill season_id on bookings
    // ====================================================
    console.log("🌦️ STEP 7: Setting season_id on bookings...");

    await prisma.$executeRaw`
    UPDATE booking b
    SET season_id = s.season_id
    FROM time_slot ts, season s
    WHERE b.time_slot_id = ts.time_slot_id
      AND b.university_id = ts.university_id
      AND (
        (s.month_start <= s.month_end 
          AND EXTRACT(MONTH FROM ts.time_slot_start_datetime) BETWEEN s.month_start AND s.month_end)
        OR
        (s.month_start > s.month_end 
          AND (EXTRACT(MONTH FROM ts.time_slot_start_datetime) >= s.month_start 
               OR EXTRACT(MONTH FROM ts.time_slot_start_datetime) <= s.month_end))
      )
  `;

    const seasonDist = await prisma.$queryRaw<any[]>`
    SELECT s.season_name_th, COUNT(*)::int as cnt
    FROM booking b JOIN season s ON b.season_id = s.season_id
    GROUP BY s.season_name_th ORDER BY cnt DESC
  `;
    console.table(seasonDist);

    // ====================================================
    // STEP 8: Seed AcademicTerm for all universities  
    // ====================================================
    console.log("📅 STEP 8: Seeding AcademicTerms...");

    const termTypes = await prisma.academicTermType.findMany();
    const universities = await prisma.university.findMany({
        select: { university_id: true },
    });

    const termData: any[] = [];
    for (const uni of universities) {
        for (const year of [2562, 2563, 2564, 2565, 2566, 2567, 2568]) {
            for (const tt of termTypes) {
                let startDate: Date, endDate: Date;
                const baseYear = year - 543; // BE to CE

                switch (tt.academic_term_type_code) {
                    case "SEM_1":
                        startDate = new Date(`${baseYear}-06-16`);
                        endDate = new Date(`${baseYear}-10-31`);
                        break;
                    case "SEM_2":
                        startDate = new Date(`${baseYear}-11-17`);
                        endDate = new Date(`${baseYear + 1}-03-31`);
                        break;
                    case "SEM_3":
                    case "SUMMER":
                        startDate = new Date(`${baseYear + 1}-04-14`);
                        endDate = new Date(`${baseYear + 1}-06-06`);
                        break;
                    default:
                        startDate = new Date(`${baseYear}-06-01`);
                        endDate = new Date(`${baseYear}-12-31`);
                }

                termData.push({
                    university_id: uni.university_id,
                    academic_term_type_id: tt.academic_term_type_id,
                    academic_year: year,
                    term_start_date: startDate,
                    term_end_date: endDate,
                    is_active: year === 2568 && tt.academic_term_type_code === "SEM_2",
                });
            }
        }
    }

    // Batch insert
    const BATCH = 5000;
    for (let i = 0; i < termData.length; i += BATCH) {
        await prisma.academicTerm.createMany({
            data: termData.slice(i, i + BATCH),
            skipDuplicates: true,
        });
    }
    console.log(`  Created ${termData.length} AcademicTerms`);

    // ====================================================
    // STEP 9: Backfill academic_term_id on bookings
    // ====================================================
    console.log("📅 STEP 9: Setting academic_term_id on bookings...");

    await prisma.$executeRaw`
    UPDATE booking b
    SET academic_term_id = at.term_id
    FROM time_slot ts, academic_term at
    WHERE b.time_slot_id = ts.time_slot_id
      AND b.university_id = ts.university_id
      AND ts.university_id = at.university_id
      AND ts.time_slot_start_datetime::date BETWEEN at.term_start_date AND at.term_end_date
  `;

    const termBookingDist = await prisma.$queryRaw<any[]>`
    SELECT att.academic_term_type_code, at.academic_year, COUNT(*)::int as cnt
    FROM booking b 
    JOIN academic_term at ON b.academic_term_id = at.term_id
    JOIN academic_term_type att ON at.academic_term_type_id = att.academic_term_type_id
    GROUP BY att.academic_term_type_code, at.academic_year
    ORDER BY at.academic_year, att.academic_term_type_code
    LIMIT 20
  `;
    console.table(termBookingDist);

    // ====================================================
    // FINAL: Summary
    // ====================================================
    console.log("\n🎉 BACKFILL COMPLETE! Final summary:\n");

    const finalStatus = await prisma.$queryRaw<any[]>`
    SELECT ss.student_status_code, COUNT(*)::int as cnt
    FROM student s JOIN student_status ss ON s.student_status_id = ss.student_status_id
    GROUP BY ss.student_status_code ORDER BY cnt DESC
  `;
    console.log("Student Status:");
    console.table(finalStatus);

    const finalEdu = await prisma.$queryRaw<any[]>`
    SELECT education_level, COUNT(*)::int as cnt
    FROM student_academic GROUP BY education_level ORDER BY cnt DESC
  `;
    console.log("Education Level:");
    console.table(finalEdu);

    const finalNat = await prisma.$queryRaw<any[]>`
    SELECT c.nationality_type, COUNT(*)::int as cnt
    FROM student_profile sp JOIN country c ON sp.country_id = c.country_id
    GROUP BY c.nationality_type ORDER BY cnt DESC
  `;
    console.log("Nationality:");
    console.table(finalNat);

    const finalSeason = await prisma.$queryRaw<any[]>`
    SELECT s.season_name_th, COUNT(*)::int as cnt
    FROM booking b LEFT JOIN season s ON b.season_id = s.season_id
    GROUP BY s.season_name_th ORDER BY cnt DESC
  `;
    console.log("Booking Seasons:");
    console.table(finalSeason);

    await prisma.$disconnect();
}

main().catch(console.error);
