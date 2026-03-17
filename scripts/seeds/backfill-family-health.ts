// scripts/backfill-family-health.ts
// Backfill blood group, parental status, and chronic conditions

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🩺 Backfilling blood group, parental status, chronic conditions...\n");

    // ============================================================
    // STEP 1: Blood Group — Thailand distribution
    // O: 39%, B: 33%, A: 22%, AB: 6% (Thai Red Cross data)
    // ============================================================
    console.log("🩸 STEP 1: Blood group...");

    await prisma.$executeRaw`
    UPDATE student_profile
    SET student_blood_group = CASE
      WHEN random() < 0.39 THEN 'O'
      WHEN random() < 0.72 THEN 'B'
      WHEN random() < 0.94 THEN 'A'
      ELSE 'AB'
    END::"BloodGroup"
  `;

    const bloodDist = await prisma.$queryRaw<any[]>`
    SELECT student_blood_group, COUNT(*)::int as cnt,
           ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM student_profile) * 100, 1) as pct
    FROM student_profile GROUP BY student_blood_group ORDER BY cnt DESC
  `;
    console.table(bloodDist);

    // ============================================================
    // STEP 2: Parental Status — Thailand statistics
    // TOGETHER: 72% | DIVORCED: 15% | FATHER_DECEASED: 5%
    // MOTHER_DECEASED: 2% | BOTH_DECEASED: 1% | SINGLE_PARENT: 5%
    // ============================================================
    console.log("👨‍👩‍👧 STEP 2: Parental status...");

    await prisma.$executeRaw`
    UPDATE student_profile
    SET parental_status = CASE
      WHEN random() < 0.72 THEN 'TOGETHER'
      WHEN random() < 0.87 THEN 'DIVORCED'
      WHEN random() < 0.92 THEN 'FATHER_DECEASED'
      WHEN random() < 0.94 THEN 'MOTHER_DECEASED'
      WHEN random() < 0.95 THEN 'BOTH_DECEASED'
      ELSE 'SINGLE_PARENT'
    END::"ParentalStatus"
  `;

    // Cross-correlation: lower income → higher rate of single-parent / deceased
    await prisma.$executeRaw`
    UPDATE student_profile
    SET parental_status = CASE
      WHEN random() < 0.45 THEN 'TOGETHER'
      WHEN random() < 0.70 THEN 'DIVORCED'
      WHEN random() < 0.80 THEN 'FATHER_DECEASED'
      WHEN random() < 0.88 THEN 'MOTHER_DECEASED'
      WHEN random() < 0.93 THEN 'BOTH_DECEASED'
      ELSE 'SINGLE_PARENT'
    END::"ParentalStatus"
    WHERE family_income_bracket = 'UNDER_100K'
  `;

    const parentDist = await prisma.$queryRaw<any[]>`
    SELECT parental_status, COUNT(*)::int as cnt,
           ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM student_profile) * 100, 1) as pct
    FROM student_profile GROUP BY parental_status ORDER BY cnt DESC
  `;
    console.table(parentDist);

    // ============================================================
    // STEP 3: Seed ChronicConditionCategory
    // ============================================================
    console.log("📋 STEP 3: Seeding disease categories...");

    await prisma.chronicConditionCategory.createMany({
        data: [
            { condition_code: "ALLERGY", condition_name_th: "ภูมิแพ้", condition_name_en: "Allergy", sort_order: 1 },
            { condition_code: "ASTHMA", condition_name_th: "หอบหืด", condition_name_en: "Asthma", sort_order: 2 },
            { condition_code: "DIABETES", condition_name_th: "เบาหวาน", condition_name_en: "Diabetes", sort_order: 3 },
            { condition_code: "HEART_DISEASE", condition_name_th: "โรคหัวใจ", condition_name_en: "Heart Disease", sort_order: 4 },
            { condition_code: "HYPERTENSION", condition_name_th: "ความดันโลหิตสูง", condition_name_en: "Hypertension", sort_order: 5 },
            { condition_code: "EPILEPSY", condition_name_th: "โรคลมชัก", condition_name_en: "Epilepsy", sort_order: 6 },
            { condition_code: "THALASSEMIA", condition_name_th: "ธาลัสซีเมีย", condition_name_en: "Thalassemia", sort_order: 7 },
            { condition_code: "G6PD", condition_name_th: "ภาวะพร่องเอนไซม์ G6PD", condition_name_en: "G6PD Deficiency", sort_order: 8 },
            { condition_code: "MIGRAINE", condition_name_th: "ไมเกรน", condition_name_en: "Migraine", sort_order: 9 },
            { condition_code: "DEPRESSION", condition_name_th: "โรคซึมเศร้า", condition_name_en: "Depression", sort_order: 10 },
            { condition_code: "ANXIETY", condition_name_th: "โรควิตกกังวล", condition_name_en: "Anxiety Disorder", sort_order: 11 },
            { condition_code: "ADHD", condition_name_th: "สมาธิสั้น", condition_name_en: "ADHD", sort_order: 12 },
            { condition_code: "THYROID", condition_name_th: "โรคไทรอยด์", condition_name_en: "Thyroid Disorder", sort_order: 13 },
        ],
        skipDuplicates: true,
    });

    const cats = await prisma.chronicConditionCategory.findMany({ orderBy: { sort_order: "asc" } });
    console.log(`  Created ${cats.length} categories`);

    // ============================================================
    // STEP 4: Assign chronic conditions to students
    // ~70% no disease | ~20% 1 disease | ~8% 2 diseases | ~2% 3+
    // Common for university students: allergy, migraine, depression, anxiety
    // ============================================================
    console.log("🏥 STEP 4: Assigning chronic conditions to students...");

    // Build category map
    const catMap: Record<string, number> = {};
    cats.forEach(c => { catMap[c.condition_code] = c.condition_category_id; });

    // Prevalence rates for Thai university students (per condition)
    const prevalence: Record<string, number> = {
        ALLERGY: 0.15,  // 15% — very common in Thailand
        MIGRAINE: 0.08,  // 8% — common in young adults
        DEPRESSION: 0.05,  // 5% — WHO Thailand data
        ANXIETY: 0.04,  // 4%
        ASTHMA: 0.04,  // 4%
        THALASSEMIA: 0.03,  // 3% — carrier rate high in Thailand
        G6PD: 0.02,  // 2%
        THYROID: 0.015, // 1.5%
        ADHD: 0.01,  // 1%
        EPILEPSY: 0.008, // 0.8%
        HYPERTENSION: 0.005, // 0.5% (rare at young age)
        DIABETES: 0.003, // 0.3% (Type 1 only for young)
        HEART_DISEASE: 0.002, // 0.2%
    };

    // For each condition, randomly assign to students
    for (const [code, rate] of Object.entries(prevalence)) {
        const catId = catMap[code];
        if (!catId) continue;

        const count = Math.round(1763590 * rate); // total student count approx
        console.log(`  ${code}: assigning ~${count} students (${(rate * 100).toFixed(1)}%)...`);

        await prisma.$executeRaw`
      INSERT INTO student_chronic_condition (student_id, university_id, condition_category_id)
      SELECT sp.student_id, sp.university_id, ${catId}
      FROM student_profile sp
      WHERE random() < ${rate}
      ON CONFLICT (student_id, university_id, condition_category_id) DO NOTHING
    `;
    }

    // Cross-correlation: DIVORCED/DECEASED → higher depression/anxiety
    console.log("  Boosting depression/anxiety for DIVORCED/DECEASED...");
    await prisma.$executeRaw`
    INSERT INTO student_chronic_condition (student_id, university_id, condition_category_id)
    SELECT sp.student_id, sp.university_id, ${catMap.DEPRESSION}
    FROM student_profile sp
    WHERE sp.parental_status IN ('DIVORCED', 'BOTH_DECEASED', 'FATHER_DECEASED', 'MOTHER_DECEASED')
      AND random() < 0.10
    ON CONFLICT (student_id, university_id, condition_category_id) DO NOTHING
  `;

    await prisma.$executeRaw`
    INSERT INTO student_chronic_condition (student_id, university_id, condition_category_id)
    SELECT sp.student_id, sp.university_id, ${catMap.ANXIETY}
    FROM student_profile sp
    WHERE sp.parental_status IN ('DIVORCED', 'BOTH_DECEASED')
      AND random() < 0.08
    ON CONFLICT (student_id, university_id, condition_category_id) DO NOTHING
  `;

    // ============================================================
    // FINAL: Verification
    // ============================================================
    console.log("\n========================================");
    console.log("🔬 VERIFICATION REPORT");
    console.log("========================================\n");

    const condDist = await prisma.$queryRaw<any[]>`
    SELECT c.condition_code, c.condition_name_th, COUNT(scc.id)::int as cnt,
           ROUND(COUNT(scc.id)::numeric / (SELECT COUNT(*) FROM student_profile) * 100, 2) as pct
    FROM chronic_condition_category c
    LEFT JOIN student_chronic_condition scc ON c.condition_category_id = scc.condition_category_id
    GROUP BY c.condition_code, c.condition_name_th, c.sort_order
    ORDER BY cnt DESC
  `;
    console.log("Disease prevalence:");
    console.table(condDist);

    const perStudent = await prisma.$queryRaw<any[]>`
    SELECT num_conditions, COUNT(*)::int as student_count,
           ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM student_profile) * 100, 1) as pct
    FROM (
      SELECT sp.student_id, COUNT(scc.id)::int as num_conditions
      FROM student_profile sp
      LEFT JOIN student_chronic_condition scc ON sp.student_id = scc.student_id AND sp.university_id = scc.university_id
      GROUP BY sp.student_id
    ) t
    GROUP BY num_conditions ORDER BY num_conditions
  `;
    console.log("Conditions per student:");
    console.table(perStudent);

    // Cross-check: parental_status vs depression rate
    const crossCheck = await prisma.$queryRaw<any[]>`
    SELECT sp.parental_status,
           COUNT(DISTINCT sp.student_id)::int as total,
           COUNT(DISTINCT scc.student_id)::int as depressed,
           ROUND(COUNT(DISTINCT scc.student_id)::numeric / NULLIF(COUNT(DISTINCT sp.student_id), 0) * 100, 2) as depression_pct
    FROM student_profile sp
    LEFT JOIN student_chronic_condition scc 
      ON sp.student_id = scc.student_id AND sp.university_id = scc.university_id
      AND scc.condition_category_id = ${catMap.DEPRESSION}
    GROUP BY sp.parental_status ORDER BY depression_pct DESC
  `;
    console.log("Depression rate by parental status:");
    console.table(crossCheck);

    await prisma.$disconnect();
}

main().catch(console.error);
