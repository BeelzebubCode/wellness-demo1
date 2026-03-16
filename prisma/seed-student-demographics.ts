// prisma/seed-student-demographics.ts
// Populate student_profile with income_bracket, blood_group, parental_status, sibling data
// Uses a numbered-bins approach based on row_number for true per-row distribution

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function exec(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  🎲  Seed Student Demographics                       ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  // 1) Income bracket
  // Use a deterministic hash of student_id to bucket students into income brackets
  console.log("💰 Assigning income brackets...");
  await exec(`
    WITH brackets AS (
      SELECT income_bracket_id, code,
        ROW_NUMBER() OVER (ORDER BY sort_order) as rn,
        COUNT(*) OVER () as total
      FROM income_bracket_category WHERE is_active = true
    ),
    students AS (
      SELECT student_id, university_id,
        -- use hashtext for good distribution
        abs(hashtext(student_id::text || '-income-' || university_id::text)) % 1000 as h
      FROM student_profile
    ),
    assigned AS (
      SELECT s.student_id, s.university_id,
        CASE
          WHEN s.h < 250 THEN (SELECT income_bracket_id FROM income_bracket_category WHERE code='UNDER_100K')
          WHEN s.h < 500 THEN (SELECT income_bracket_id FROM income_bracket_category WHERE code='BETWEEN_100K_200K')
          WHEN s.h < 700 THEN (SELECT income_bracket_id FROM income_bracket_category WHERE code='BETWEEN_200K_300K')
          WHEN s.h < 850 THEN (SELECT income_bracket_id FROM income_bracket_category WHERE code='BETWEEN_300K_500K')
          WHEN s.h < 930 THEN (SELECT income_bracket_id FROM income_bracket_category WHERE code='BETWEEN_500K_800K')
          WHEN s.h < 970 THEN (SELECT income_bracket_id FROM income_bracket_category WHERE code='BETWEEN_800K_1M')
          ELSE (SELECT income_bracket_id FROM income_bracket_category WHERE code='OVER_1M')
        END as income_bracket_id
      FROM students s
    )
    UPDATE student_profile sp
    SET income_bracket_id = a.income_bracket_id
    FROM assigned a
    WHERE sp.student_id = a.student_id AND sp.university_id = a.university_id
  `);
  console.log("   ✅ Income brackets assigned");

  // 2) Blood group (Thai distribution)
  console.log("🩸 Assigning blood groups...");
  await exec(`
    WITH students AS (
      SELECT student_id, university_id,
        abs(hashtext(student_id::text || '-blood-' || university_id::text)) % 100 as h
      FROM student_profile
    ),
    assigned AS (
      SELECT s.student_id, s.university_id,
        CASE
          WHEN s.h < 39 THEN (SELECT blood_group_id FROM blood_group_category WHERE code='O')
          WHEN s.h < 63 THEN (SELECT blood_group_id FROM blood_group_category WHERE code='B')
          WHEN s.h < 91 THEN (SELECT blood_group_id FROM blood_group_category WHERE code='A')
          ELSE (SELECT blood_group_id FROM blood_group_category WHERE code='AB')
        END as blood_group_id
      FROM students s
    )
    UPDATE student_profile sp
    SET blood_group_id = a.blood_group_id
    FROM assigned a
    WHERE sp.student_id = a.student_id AND sp.university_id = a.university_id
  `);
  console.log("   ✅ Blood groups assigned");

  // 3) Parental status
  console.log("👨‍👩‍👧 Assigning parental status...");
  await exec(`
    WITH students AS (
      SELECT student_id, university_id,
        abs(hashtext(student_id::text || '-parent-' || university_id::text)) % 100 as h
      FROM student_profile
    ),
    assigned AS (
      SELECT s.student_id, s.university_id,
        CASE
          WHEN s.h < 55 THEN (SELECT parental_status_id FROM parental_status_category WHERE code='TOGETHER')
          WHEN s.h < 73 THEN (SELECT parental_status_id FROM parental_status_category WHERE code='DIVORCED')
          WHEN s.h < 83 THEN (SELECT parental_status_id FROM parental_status_category WHERE code='SINGLE_PARENT')
          WHEN s.h < 91 THEN (SELECT parental_status_id FROM parental_status_category WHERE code='FATHER_DECEASED')
          WHEN s.h < 97 THEN (SELECT parental_status_id FROM parental_status_category WHERE code='MOTHER_DECEASED')
          ELSE (SELECT parental_status_id FROM parental_status_category WHERE code='BOTH_DECEASED')
        END as parental_status_id
      FROM students s
    )
    UPDATE student_profile sp
    SET parental_status_id = a.parental_status_id
    FROM assigned a
    WHERE sp.student_id = a.student_id AND sp.university_id = a.university_id
  `);
  console.log("   ✅ Parental status assigned");

  // 4) Sibling count & birth order
  console.log("👶 Assigning sibling count & birth order...");
  await exec(`
    WITH students AS (
      SELECT student_id, university_id,
        abs(hashtext(student_id::text || '-sib-' || university_id::text)) % 100 as h,
        abs(hashtext(student_id::text || '-bo-' || university_id::text)) as h2
      FROM student_profile
    ),
    assigned AS (
      SELECT s.student_id, s.university_id,
        CASE
          WHEN s.h < 12 THEN 1
          WHEN s.h < 55 THEN 2
          WHEN s.h < 80 THEN 3
          WHEN s.h < 92 THEN 4
          ELSE 5
        END as sibling_count,
        s.h2
      FROM students s
    )
    UPDATE student_profile sp
    SET sibling_count = a.sibling_count,
        birth_order = GREATEST(1, LEAST(a.sibling_count, (a.h2 % a.sibling_count) + 1))
    FROM assigned a
    WHERE sp.student_id = a.student_id AND sp.university_id = a.university_id
  `);
  console.log("   ✅ Sibling count & birth order assigned");

  // Print summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 DEMOGRAPHICS SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const incomeDist: { code: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(ibc.code, 'NULL') as code, COUNT(*)::bigint as count
    FROM student_profile sp
    LEFT JOIN income_bracket_category ibc ON ibc.income_bracket_id = sp.income_bracket_id
    GROUP BY ibc.code ORDER BY count DESC
  `);
  console.log("\n   💰 Income Brackets:");
  incomeDist.forEach(r => console.log(`      ${(r.code || 'NULL').padEnd(22)} ${Number(r.count).toLocaleString().padStart(10)}`));

  const bloodDist: { code: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(bgc.code, 'NULL') as code, COUNT(*)::bigint as count
    FROM student_profile sp
    LEFT JOIN blood_group_category bgc ON bgc.blood_group_id = sp.blood_group_id
    GROUP BY bgc.code ORDER BY count DESC
  `);
  console.log("\n   🩸 Blood Groups:");
  bloodDist.forEach(r => console.log(`      ${(r.code || 'NULL').padEnd(22)} ${Number(r.count).toLocaleString().padStart(10)}`));

  const parentalDist: { code: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(psc.code, 'NULL') as code, COUNT(*)::bigint as count
    FROM student_profile sp
    LEFT JOIN parental_status_category psc ON psc.parental_status_id = sp.parental_status_id
    GROUP BY psc.code ORDER BY count DESC
  `);
  console.log("\n   👨‍👩‍👧 Parental Status:");
  parentalDist.forEach(r => console.log(`      ${(r.code || 'NULL').padEnd(22)} ${Number(r.count).toLocaleString().padStart(10)}`));

  console.log("\n🎉 Done!");
}

main()
  .catch(e => { console.error("❌ Fatal:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
