// scripts/seeds/seed-academic-periods.ts
// =========================================================================
// สร้าง academic_period (ช่วงสอบกลางภาค + ปลายภาค) จาก academic_term ที่มีอยู่
//
// หลักการคำนวณวันที่:
//   Midterm : เริ่มต้น + 40% ของระยะเทอม  (2 สัปดาห์)
//   Final   : สิ้นสุด  - 3 สัปดาห์        (2 สัปดาห์)
//
// Usage:
//   npx ts-node --project tsconfig.json scripts/seeds/seed-academic-periods.ts
//   หรือ  npx tsx scripts/seeds/seed-academic-periods.ts
// =========================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function diffDays(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function fmt(d: Date): string {
    return d.toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🔄  seed-academic-periods — เริ่มต้น\n");

    // 1. ดึง period type IDs
    const midtermType = await prisma.academicPeriodTypeCategory.findUnique({
        where: { code: "MIDTERM_EXAM" },
        select: { academic_period_type_id: true, name_th: true },
    });
    const finalType = await prisma.academicPeriodTypeCategory.findUnique({
        where: { code: "FINAL_EXAM" },
        select: { academic_period_type_id: true, name_th: true },
    });

    if (!midtermType || !finalType) {
        // ยังไม่มี reference data — สร้างขึ้นมา
        console.log("  ⚠️  ไม่พบ academic_period_type_category — กำลัง upsert...");
        await prisma.academicPeriodTypeCategory.upsert({
            where:  { code: "MIDTERM_EXAM" },
            create: { code: "MIDTERM_EXAM", name_th: "สอบกลางภาค", name_en: "Midterm Exam", sort_order: 1 },
            update: {},
        });
        await prisma.academicPeriodTypeCategory.upsert({
            where:  { code: "FINAL_EXAM" },
            create: { code: "FINAL_EXAM", name_th: "สอบปลายภาค", name_en: "Final Exam", sort_order: 2 },
            update: {},
        });
    }

    const midId = midtermType?.academic_period_type_id
        ?? (await prisma.academicPeriodTypeCategory.findUnique({ where: { code: "MIDTERM_EXAM" } }))!.academic_period_type_id;
    const finId = finalType?.academic_period_type_id
        ?? (await prisma.academicPeriodTypeCategory.findUnique({ where: { code: "FINAL_EXAM" } }))!.academic_period_type_id;

    console.log(`  ✅  MIDTERM_EXAM id=${midId}   FINAL_EXAM id=${finId}\n`);

    // 2. ดึง academic_term ทั้งหมด
    const terms = await prisma.academicTerm.findMany({
        select: {
            term_id: true,
            university_id: true,
            academic_year: true,
            term_start_date: true,
            term_end_date: true,
            academicTermType: { select: { academic_term_type_name_th: true } },
        },
        orderBy: [{ academic_year: "asc" }, { term_id: "asc" }],
    });

    console.log(`  📋  พบ academic_term จำนวน ${terms.length} แถว\n`);

    // 3. ตรวจสอบว่ามี period อยู่แล้วหรือไม่
    const existingCount = await prisma.academicPeriod.count();
    if (existingCount > 0) {
        console.log(`  ⚠️  มี academic_period อยู่แล้ว ${existingCount} แถว`);
        console.log("       ถ้าต้องการ re-seed ให้ลบข้อมูลเดิมก่อน: DELETE FROM academic_period;\n");
        console.log("  ต้องการ skip หรือ overwrite? กำลัง SKIP เพราะมีข้อมูลอยู่แล้ว\n");
        return;
    }

    // 4. สร้าง period records
    type PeriodCreate = {
        term_id: number;
        university_id: number;
        academic_period_type_id: number;
        period_name_th: string;
        period_name_en: string;
        period_start_date: Date;
        period_end_date: Date;
        sort_order: number;
    };

    const batch: PeriodCreate[] = [];

    let skipCount = 0;

    for (const term of terms) {
        const start   = term.term_start_date;
        const end     = term.term_end_date;
        const duration = diffDays(start, end);

        if (duration < 20) {
            // เทอมสั้นมาก — ข้าม
            skipCount++;
            continue;
        }

        const termLabel = term.academicTermType.academic_term_type_name_th;
        const yearBE    = term.academic_year + 543; // academic_year เป็น ค.ศ. → แปลงเป็น พ.ศ.

        // ── Midterm: ~40% ของเทอม, ยาว 14 วัน ──────────────────────────────
        const midStart = addDays(start, Math.round(duration * 0.40));
        const midEnd   = addDays(midStart, 13); // 14 วัน (inclusive)

        batch.push({
            term_id:                term.term_id,
            university_id:          term.university_id,
            academic_period_type_id: midId,
            period_name_th:         `สอบกลางภาค ${termLabel} ปี ${yearBE}`,
            period_name_en:         `Midterm Exam ${termLabel} ${term.academic_year}`,
            period_start_date:      midStart,
            period_end_date:        midEnd,
            sort_order:             1,
        });

        // ── Final: ก่อนสิ้นสุด 3 สัปดาห์, ยาว 14 วัน ─────────────────────
        const finStart = addDays(end, -21);
        const finEnd   = addDays(end, -8); // 14 วัน (inclusive)

        // ป้องกัน final ทับซ้อน midterm
        if (finStart > midEnd) {
            batch.push({
                term_id:                term.term_id,
                university_id:          term.university_id,
                academic_period_type_id: finId,
                period_name_th:         `สอบปลายภาค ${termLabel} ปี ${yearBE}`,
                period_name_en:         `Final Exam ${termLabel} ${term.academic_year}`,
                period_start_date:      finStart,
                period_end_date:        finEnd,
                sort_order:             2,
            });
        }
    }

    console.log(`  🗓️  กำลังสร้าง ${batch.length} academic_period  (ข้าม ${skipCount} term ที่สั้นเกินไป)`);

    // Insert แบบ chunk ละ 500 แถว
    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < batch.length; i += CHUNK) {
        await prisma.academicPeriod.createMany({
            data: batch.slice(i, i + CHUNK),
            skipDuplicates: true,
        });
        inserted += Math.min(CHUNK, batch.length - i);
        process.stdout.write(`\r  ✏️  ${inserted} / ${batch.length}`);
    }

    console.log(`\n\n  ✅  เสร็จสิ้น — สร้าง academic_period จำนวน ${inserted} แถว\n`);

    // Summary sample
    const sample = await prisma.academicPeriod.findMany({
        take: 4,
        orderBy: { period_id: "asc" },
        select: {
            period_id: true,
            period_name_th: true,
            period_start_date: true,
            period_end_date: true,
            term: { select: { university_id: true, academic_year: true } },
        },
    });
    console.log("  📌 ตัวอย่างข้อมูลที่สร้าง:");
    sample.forEach(p => {
        console.log(
            `     [${p.period_id}] ${p.period_name_th} | ${fmt(p.period_start_date)} – ${fmt(p.period_end_date)} | univ=${p.term.university_id}`
        );
    });
    console.log("");
}

main()
    .catch(e => { console.error("❌ Error:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
