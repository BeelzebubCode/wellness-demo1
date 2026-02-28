// scripts/fix-international-students.ts
// Fix international student distribution to realistic numbers
// Target: 53,000 total international students
// China: 28,000 | Myanmar: 7,000 | Cambodia: 5,000 | Laos: 4,000 
// Vietnam: 3,500 | Japan: 2,000 | Korea: 1,500 | US: 1,000 | UK: 1,000

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Country targets
const COUNTRY_TARGETS: Record<string, number> = {
    CN: 28000,  // จีน — อันดับ 1 ห่างจากที่ 2 มาก
    MM: 7000,   // เมียนมา
    KH: 5000,   // กัมพูชา
    LA: 4000,   // ลาว
    VN: 3500,   // เวียดนาม
    JP: 2000,   // ญี่ปุ่น
    KR: 1500,   // เกาหลี
    US: 1000,   // สหรัฐ
    GB: 1000,   // อังกฤษ
};
const TOTAL_INTL = Object.values(COUNTRY_TARGETS).reduce((a, b) => a + b, 0); // 53,000

// Private uni with highest international count
const UNI_TARGETS: Record<number, number> = {
    72: 4670,   // DPU (ธุรกิจบัณฑิตย์)
    154: 1736,  // ABAC (อัสสัมชัญ)
    59: 2389,   // BTU (กรุงเทพธนบุรี)
};

async function main() {
    console.log(`🌍 Fixing international student distribution...`);
    console.log(`   Target: ${TOTAL_INTL} international students\n`);

    const thCountryId = 1; // Thailand

    // ============================================================
    // STEP 1: Convert ALL international students back to Thai first
    // ============================================================
    console.log("STEP 1: Resetting all students to Thai...");

    const resetCount = await prisma.$executeRaw`
    UPDATE student_profile
    SET country_id = ${thCountryId},
        student_nationality = 'ไทย'
    WHERE country_id != ${thCountryId}
  `;
    console.log(`  Reset ${resetCount} students to Thai`);

    // Also reset program to Regular
    await prisma.$executeRaw`
    UPDATE student_academic
    SET student_program = 'Regular Program'
    WHERE student_program = 'International Program'
  `;

    // ============================================================
    // STEP 2: Assign international students to specific universities
    // Strategy: Pick random active students from each university
    // ============================================================
    console.log("\nSTEP 2: Assigning international students per university...");

    const countries = await prisma.country.findMany({
        where: { nationality_type: "INTERNATIONAL" },
    });
    const countryMap = new Map(countries.map(c => [c.country_code_alpha2, c]));

    // Get all universities and compute how many intl each should have
    const allUnis = await prisma.$queryRaw<any[]>`
    SELECT u.university_id, u.university_code, u.university_name_th, u.university_type,
           COUNT(s.student_id)::int as total_students
    FROM university u
    JOIN student s ON u.university_id = s.university_id
    GROUP BY u.university_id, u.university_code, u.university_name_th, u.university_type
    HAVING COUNT(s.student_id) > 0
    ORDER BY u.university_id
  `;

    // Allocate international students per uni
    const totalStudents = allUnis.reduce((a: number, b: any) => a + b.total_students, 0);

    // Fixed allocations for target universities
    const fixedAlloc = new Map<number, number>(Object.entries(UNI_TARGETS).map(([k, v]) => [Number(k), v]));
    const fixedTotal = [...fixedAlloc.values()].reduce((a, b) => a + b, 0);
    const remainingIntl = TOTAL_INTL - fixedTotal; // ~44,205

    // Remaining distributed proportionally by size, with private unis getting 2x weight
    const remainingUnis = allUnis.filter(u => !fixedAlloc.has(u.university_id));
    const weightedTotal = remainingUnis.reduce((sum: number, u: any) => {
        const multiplier = u.university_type === "PRIVATE" ? 2.0 :
            u.university_type === "SUPERVISED" ? 0.8 : 0.6;
        return sum + u.total_students * multiplier;
    }, 0);

    const uniAllocations = new Map<number, number>();
    for (const [id, count] of fixedAlloc) {
        uniAllocations.set(id, count);
    }

    let allocated = 0;
    for (const u of remainingUnis) {
        const multiplier = u.university_type === "PRIVATE" ? 2.0 :
            u.university_type === "SUPERVISED" ? 0.8 : 0.6;
        const share = Math.round(remainingIntl * (u.total_students * multiplier) / weightedTotal);
        const capped = Math.min(share, Math.floor(u.total_students * 0.08)); // max 8% intl per uni
        uniAllocations.set(u.university_id, capped);
        allocated += capped;
    }

    // Adjust to hit exact total
    const diff = TOTAL_INTL - (fixedTotal + allocated);
    if (diff > 0) {
        // Add extras to DPU
        uniAllocations.set(72, (uniAllocations.get(72) || 0) + diff);
    }

    console.log(`  Allocations ready for ${uniAllocations.size} universities`);

    // ============================================================
    // STEP 3: For each university, pick random students and assign countries
    // ============================================================
    console.log("\nSTEP 3: Picking random students and assigning countries...");

    // Build country distribution percentages
    const countryPcts: [string, number][] = Object.entries(COUNTRY_TARGETS).map(([code, count]) => [
        code, count / TOTAL_INTL,
    ]);

    let totalAssigned = 0;
    let uniCount = 0;

    for (const [uniId, intlCount] of uniAllocations) {
        if (intlCount <= 0) continue;

        // Select random student_ids from this university
        const randomStudents = await prisma.$queryRaw<any[]>`
      SELECT sp.student_id FROM student_profile sp
      WHERE sp.university_id = ${uniId}
        AND sp.country_id = ${thCountryId}
      ORDER BY random()
      LIMIT ${intlCount}
    `;

        if (randomStudents.length === 0) continue;

        const studentIds = randomStudents.map((s: any) => s.student_id);

        // Distribute by country
        let idx = 0;
        for (const [countryCode, pct] of countryPcts) {
            const country = countryMap.get(countryCode);
            if (!country) continue;

            const count = Math.round(studentIds.length * pct);
            const batch = studentIds.slice(idx, idx + count);
            if (batch.length === 0) { idx += count; continue; }

            await prisma.$executeRaw`
        UPDATE student_profile
        SET country_id = ${country.country_id},
            student_nationality = ${country.country_name_th}
        WHERE student_id = ANY(${batch}::int[])
          AND university_id = ${uniId}
      `;

            idx += count;
        }

        // Any remaining → first country (China)
        if (idx < studentIds.length) {
            const batch = studentIds.slice(idx);
            const cn = countryMap.get("CN")!;
            await prisma.$executeRaw`
        UPDATE student_profile
        SET country_id = ${cn.country_id},
            student_nationality = ${cn.country_name_th}
        WHERE student_id = ANY(${batch}::int[])
          AND university_id = ${uniId}
      `;
        }

        totalAssigned += randomStudents.length;
        uniCount++;
        if (uniCount % 20 === 0) {
            console.log(`  Progress: ${uniCount} universities, ${totalAssigned} students assigned`);
        }
    }
    console.log(`  Total: ${totalAssigned} international students assigned`);

    // ============================================================
    // STEP 4: Set International Program for all international students
    // ============================================================
    console.log("\nSTEP 4: Setting International Program...");

    const progUpdated = await prisma.$executeRaw`
    UPDATE student_academic sa
    SET student_program = 'International Program'
    FROM student_profile sp
    WHERE sa.student_id = sp.student_id 
      AND sa.university_id = sp.university_id
      AND sp.country_id != ${thCountryId}
  `;
    console.log(`  Updated ${progUpdated} to International Program`);

    // ============================================================
    // STEP 5: Fix income bracket — international students higher income
    // ============================================================
    console.log("\nSTEP 5: Adjusting income for international students...");

    await prisma.$executeRaw`
    UPDATE student_profile
    SET family_income_bracket = CASE
      WHEN random() < 0.08 THEN 'BETWEEN_300K_500K'
      WHEN random() < 0.30 THEN 'BETWEEN_500K_800K'
      WHEN random() < 0.60 THEN 'BETWEEN_800K_1M'
      ELSE 'OVER_1M'
    END::"FamilyIncomeBracket"
    WHERE country_id != ${thCountryId}
  `;

    console.log("\n✅ Done!");
    await prisma.$disconnect();
}

main().catch(console.error);
