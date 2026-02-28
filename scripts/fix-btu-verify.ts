import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
    // BTU total students
    const btu = await p.$queryRaw<any[]>`SELECT COUNT(*)::int as total FROM student WHERE university_id = 59`;
    console.log("BTU total students:", btu[0].total);

    // Force BTU to ~2389 international
    const currentBTU = await p.$queryRaw<any[]>`
    SELECT COUNT(*)::int as cnt FROM student_profile WHERE university_id = 59 AND country_id != 1
  `;
    const need = 2389 - currentBTU[0].cnt;
    console.log("BTU current intl:", currentBTU[0].cnt, "| need:", need);

    if (need > 0) {
        // Distribute among countries: 60% China, 15% Myanmar, 10% Cambodia, rest others
        const batches = [
            { countryId: 2, name: "จีน", count: Math.round(need * 0.60) },
            { countryId: 5, name: "เมียนมา", count: Math.round(need * 0.15) },
            { countryId: 7, name: "กัมพูชา", count: Math.round(need * 0.10) },
            { countryId: 6, name: "ลาว", count: Math.round(need * 0.05) },
            { countryId: 8, name: "เวียดนาม", count: Math.round(need * 0.05) },
            { countryId: 3, name: "ญี่ปุ่น", count: Math.round(need * 0.03) },
            { countryId: 4, name: "เกาหลี", count: need - Math.round(need * 0.98) },
        ];

        for (const b of batches) {
            if (b.count <= 0) continue;
            await p.$executeRaw`
        UPDATE student_profile
        SET country_id = ${b.countryId}, student_nationality = ${b.name}
        WHERE student_id IN (
          SELECT student_id FROM student_profile
          WHERE university_id = 59 AND country_id = 1
          ORDER BY random() LIMIT ${b.count}
        ) AND university_id = 59
      `;
        }
        console.log("BTU: assigned more international students");
    }

    // Set International Program
    await p.$executeRaw`
    UPDATE student_academic sa
    SET student_program = 'International Program'
    FROM student_profile sp
    WHERE sa.student_id = sp.student_id AND sa.university_id = sp.university_id
      AND sp.country_id != 1 AND sa.student_program != 'International Program'
  `;

    // Fix income for intl
    await p.$executeRaw`
    UPDATE student_profile
    SET family_income_bracket = CASE
      WHEN random() < 0.08 THEN 'BETWEEN_300K_500K'::"FamilyIncomeBracket"
      WHEN random() < 0.30 THEN 'BETWEEN_500K_800K'::"FamilyIncomeBracket"
      WHEN random() < 0.60 THEN 'BETWEEN_800K_1M'::"FamilyIncomeBracket"
      ELSE 'OVER_1M'::"FamilyIncomeBracket"
    END
    WHERE country_id != 1
  `;

    // FINAL REPORT
    console.log("\n========================================");
    console.log("🔬 FINAL VERIFICATION REPORT");
    console.log("========================================\n");

    const totals = await p.$queryRaw<any[]>`
    SELECT c.nationality_type, COUNT(*)::int as cnt
    FROM student_profile sp JOIN country c ON sp.country_id = c.country_id
    GROUP BY c.nationality_type
  `;
    console.log("--- Nationality totals ---");
    console.table(totals);

    const countries = await p.$queryRaw<any[]>`
    SELECT c.country_code_alpha2, c.country_name_en, COUNT(*)::int as cnt,
           ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM student_profile sp2 JOIN country c2 ON sp2.country_id = c2.country_id WHERE c2.nationality_type = 'INTERNATIONAL') * 100, 1) as pct
    FROM student_profile sp JOIN country c ON sp.country_id = c.country_id
    WHERE c.nationality_type = 'INTERNATIONAL'
    GROUP BY c.country_code_alpha2, c.country_name_en ORDER BY cnt DESC
  `;
    console.log("--- Country distribution ---");
    console.table(countries);

    const targets = await p.$queryRaw<any[]>`
    SELECT u.university_code, u.university_name_th, COUNT(*)::int as intl_cnt
    FROM student_profile sp
    JOIN country c ON sp.country_id = c.country_id
    JOIN university u ON sp.university_id = u.university_id
    WHERE c.nationality_type = 'INTERNATIONAL' AND u.university_id IN (72, 154, 59)
    GROUP BY u.university_code, u.university_name_th ORDER BY intl_cnt DESC
  `;
    console.log("--- Target Universities ---");
    console.table(targets);

    const top10 = await p.$queryRaw<any[]>`
    SELECT u.university_code, u.university_name_th, u.university_type, COUNT(*)::int as intl_cnt,
           ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM student s2 WHERE s2.university_id = u.university_id) * 100, 1) as pct_of_uni
    FROM student_profile sp
    JOIN country c ON sp.country_id = c.country_id
    JOIN university u ON sp.university_id = u.university_id
    WHERE c.nationality_type = 'INTERNATIONAL'
    GROUP BY u.university_id, u.university_code, u.university_name_th, u.university_type
    ORDER BY intl_cnt DESC LIMIT 10
  `;
    console.log("--- Top 10 Universities ---");
    console.table(top10);

    const byType = await p.$queryRaw<any[]>`
    SELECT u.university_type, COUNT(*)::int as intl_cnt,
           ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM student_profile sp2 JOIN country c2 ON sp2.country_id = c2.country_id WHERE c2.nationality_type = 'INTERNATIONAL') * 100, 1) as pct
    FROM student_profile sp
    JOIN country c ON sp.country_id = c.country_id
    JOIN university u ON sp.university_id = u.university_id
    WHERE c.nationality_type = 'INTERNATIONAL'
    GROUP BY u.university_type ORDER BY intl_cnt DESC
  `;
    console.log("--- By University Type ---");
    console.table(byType);

    // Consistency check
    const check = await p.$queryRaw<any[]>`
    SELECT COUNT(*)::int as bad FROM student_profile sp
    JOIN country c ON sp.country_id = c.country_id
    JOIN student_academic sa ON sp.student_id = sa.student_id AND sp.university_id = sa.university_id
    WHERE c.nationality_type = 'INTERNATIONAL' AND sa.student_program != 'International Program'
  `;
    console.log("Consistency: Intl NOT in Intl Program:", check[0].bad);

    await p.$disconnect();
}

main().catch(console.error);
