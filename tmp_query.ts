import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
    // Check Chula's actual ID (125) terms
    const terms125 = await p.$queryRaw`
        SELECT at.academic_term_id, at.university_id, at.academic_term_type_id, at.academic_year,
               at.term_start_date, at.term_end_date, at.is_active,
               att.academic_term_type_code, att.academic_term_type_name_th
        FROM academic_term at
        JOIN academic_term_type att ON at.academic_term_type_id = att.academic_term_type_id
        WHERE at.university_id = 125
        AND at.academic_year >= 2567
        ORDER BY at.academic_year DESC, at.academic_term_type_id
    ` as any[];
    console.log(`=== Terms for Chula (id=125) year>=2567 (${terms125.length} rows) ===`);
    terms125.forEach((t: any) => {
        const startD = t.term_start_date instanceof Date ? t.term_start_date.toISOString().split('T')[0] : t.term_start_date;
        const endD = t.term_end_date instanceof Date ? t.term_end_date.toISOString().split('T')[0] : t.term_end_date;
        console.log(`  id=${t.academic_term_id} year=${t.academic_year} type=${t.academic_term_type_code}(${t.academic_term_type_name_th}) start=${startD} end=${endD} active=${t.is_active}`);
    });

    // Also check for Naresuan (140) and Khon Kaen (141) terms for 2568
    for (const univId of [140, 141]) {
        const terms = await p.$queryRaw`
            SELECT at.academic_term_id, at.university_id, at.academic_term_type_id, at.academic_year,
                   at.term_start_date, at.term_end_date, at.is_active,
                   att.academic_term_type_code, att.academic_term_type_name_th
            FROM academic_term at
            JOIN academic_term_type att ON at.academic_term_type_id = att.academic_term_type_id
            WHERE at.university_id = ${univId}
            AND at.academic_year >= 2567
            ORDER BY at.academic_year DESC, at.academic_term_type_id
        ` as any[];
        console.log(`\n=== Terms for univ ${univId} year>=2567 (${terms.length} rows) ===`);
        terms.forEach((t: any) => {
            const startD = t.term_start_date instanceof Date ? t.term_start_date.toISOString().split('T')[0] : t.term_start_date;
            const endD = t.term_end_date instanceof Date ? t.term_end_date.toISOString().split('T')[0] : t.term_end_date;
            console.log(`  id=${t.academic_term_id} year=${t.academic_year} type=${t.academic_term_type_code}(${t.academic_term_type_name_th}) start=${startD} end=${endD} active=${t.is_active}`);
        });
    }

    await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
