// scripts/seeds/seed-real-academic-periods.ts
// =========================================================================
// Seed ข้อมูลช่วงสอบจริงจาก 3 มหาวิทยาลัย (นเรศวร, ขอนแก่น, จุฬา)
// 1. Update academic_term dates ให้ตรงกับปฏิทินจริง
// 2. Insert academic_period (กลางภาค/ปลายภาค) ตามวันที่จริง
//
// ⚠️ ห้ามทับข้อมูลเดิม — ใช้ upsert / skipDuplicates
// ⚠️ แก้เฉพาะ 3 มหาวิทยาลัยเท่านั้น
//
// Usage:
//   npx tsx scripts/seeds/seed-real-academic-periods.ts
// =========================================================================

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── helpers ─────────────────────────────────────────────────────────────
function d(yyyy: number, mm: number, dd: number): Date {
    return new Date(Date.UTC(yyyy, mm - 1, dd));
}
function fmt(date: Date): string {
    return date.toISOString().split("T")[0];
}

// ── University IDs ──────────────────────────────────────────────────────
const NARESUAN = 140;
const KHONKAEN = 141;
const CHULA    = 125;

// ── Term data to UPDATE (real open/close dates) ─────────────────────────
// From user-provided calendar data
// NOTE: academic_year ใน DB เป็น CE, user ให้ BE
//   2568 BE = 2025 CE (academic_year=2568)
//   2569 BE = 2026 CE

interface TermUpdate {
    university_id: number;
    academic_year: number;
    academic_term_type_id: number; // 1=SEMESTER_1, 2=SEMESTER_2, 3=SUMMER
    term_start_date: Date;
    term_end_date: Date;
}

// มหาวิทยาลัยนเรศวร 2568
// ป.ตรี dates (use as primary — broader coverage)
const termUpdates: TermUpdate[] = [
    // นเรศวร เทอม 1: เปิด 23 มิ.ย. 2568 (2025-06-23) — ปิด 16 พ.ย. 2569 (ใช้ 24 ต.ค. 2568 เป็น end ของเรียน)
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 1,
      term_start_date: d(2025, 6, 23), term_end_date: d(2025, 10, 24) },
    // นเรศวร เทอม 2: 17 พ.ย. 2568 — 20 มี.ค. 2569
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 2,
      term_start_date: d(2025, 11, 17), term_end_date: d(2026, 3, 20) },
    // นเรศวร ภาคฤดูร้อน: 30 มี.ค. 2569 — 29 พ.ค. 2569
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 3,
      term_start_date: d(2026, 3, 30), term_end_date: d(2026, 5, 29) },

    // ขอนแก่น เทอม 1: 23 มิ.ย. 2568 — 10 พ.ย. 2568
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 1,
      term_start_date: d(2025, 6, 23), term_end_date: d(2025, 11, 10) },
    // ขอนแก่น เทอม 2: 24 พ.ย. 2568 — 6 เม.ย. 2569
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 2,
      term_start_date: d(2025, 11, 24), term_end_date: d(2026, 4, 6) },
    // ขอนแก่น ภาคฤดูร้อน: 20 เม.ย. 2569 — 6 มิ.ย. 2569
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 3,
      term_start_date: d(2026, 4, 20), term_end_date: d(2026, 6, 6) },

    // จุฬาฯ (ทวิภาค)
    // เทอม 1: 4 ส.ค. 2568 — 8 ธ.ค. 2568 (ปิดภาค 9 ธ.ค.)
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 1,
      term_start_date: d(2025, 8, 4), term_end_date: d(2025, 12, 8) },
    // เทอม 2: 5 ม.ค. 2569 — 12 พ.ค. 2569 (ปิดภาค 13 พ.ค.)
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 2,
      term_start_date: d(2026, 1, 5), term_end_date: d(2026, 5, 12) },
    // ภาคฤดูร้อน: 2 มิ.ย. 2569 — 18 ก.ค. 2569
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 3,
      term_start_date: d(2026, 6, 2), term_end_date: d(2026, 7, 18) },
];

// ── Period (exam) data to INSERT ────────────────────────────────────────
// MIDTERM_EXAM = 1, FINAL_EXAM = 2

interface PeriodInsert {
    university_id: number;
    academic_year: number;
    academic_term_type_id: number;
    academic_period_type_id: number; // 1=MIDTERM, 2=FINAL
    period_name_th: string;
    period_name_en: string;
    period_start_date: Date;
    period_end_date: Date;
    sort_order: number;
}

const periodInserts: PeriodInsert[] = [
    // =====================================================
    // มหาวิทยาลัยนเรศวร (ป.ตรี)
    // =====================================================
    // เทอม 1 กลางภาค: 23 ส.ค. – 31 ส.ค. 2568
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 1,
      academic_period_type_id: 1,
      period_name_th: "สอบกลางภาค เทอม 1 ปี 2568 (นเรศวร)", period_name_en: "Midterm Exam Sem1 2025 (NU)",
      period_start_date: d(2025, 8, 23), period_end_date: d(2025, 8, 31), sort_order: 1 },
    // เทอม 1 ปลายภาค: 11 ต.ค. – 26 ต.ค. 2568
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 1,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค เทอม 1 ปี 2568 (นเรศวร)", period_name_en: "Final Exam Sem1 2025 (NU)",
      period_start_date: d(2025, 10, 11), period_end_date: d(2025, 10, 26), sort_order: 2 },
    // เทอม 2 กลางภาค: 10 ม.ค. – 18 ม.ค. 2569
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 2,
      academic_period_type_id: 1,
      period_name_th: "สอบกลางภาค เทอม 2 ปี 2568 (นเรศวร)", period_name_en: "Midterm Exam Sem2 2025 (NU)",
      period_start_date: d(2026, 1, 10), period_end_date: d(2026, 1, 18), sort_order: 1 },
    // เทอม 2 ปลายภาค: 7 มี.ค. – 22 มี.ค. 2569
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 2,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค เทอม 2 ปี 2568 (นเรศวร)", period_name_en: "Final Exam Sem2 2025 (NU)",
      period_start_date: d(2026, 3, 7), period_end_date: d(2026, 3, 22), sort_order: 2 },
    // ภาคฤดูร้อน ปลายภาค: 23 พ.ค. – 31 พ.ค. 2569 (ไม่มีกลางภาค)
    { university_id: NARESUAN, academic_year: 2568, academic_term_type_id: 3,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค ภาคฤดูร้อน ปี 2568 (นเรศวร)", period_name_en: "Final Exam Summer 2025 (NU)",
      period_start_date: d(2026, 5, 23), period_end_date: d(2026, 5, 31), sort_order: 1 },

    // =====================================================
    // มหาวิทยาลัยขอนแก่น (ป.ตรี)
    // =====================================================
    // เทอม 1 กลางภาค: 25 ส.ค. – 29 ส.ค. 2568
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 1,
      academic_period_type_id: 1,
      period_name_th: "สอบกลางภาค เทอม 1 ปี 2568 (ขอนแก่น)", period_name_en: "Midterm Exam Sem1 2025 (KKU)",
      period_start_date: d(2025, 8, 25), period_end_date: d(2025, 8, 29), sort_order: 1 },
    // เทอม 1 ปลายภาค: 20 ต.ค. – 9 พ.ย. 2568
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 1,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค เทอม 1 ปี 2568 (ขอนแก่น)", period_name_en: "Final Exam Sem1 2025 (KKU)",
      period_start_date: d(2025, 10, 20), period_end_date: d(2025, 11, 9), sort_order: 2 },
    // เทอม 2 กลางภาค: 19 ม.ค. – 23 ม.ค. 2569
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 2,
      academic_period_type_id: 1,
      period_name_th: "สอบกลางภาค เทอม 2 ปี 2568 (ขอนแก่น)", period_name_en: "Midterm Exam Sem2 2025 (KKU)",
      period_start_date: d(2026, 1, 19), period_end_date: d(2026, 1, 23), sort_order: 1 },
    // เทอม 2 ปลายภาค: 23 มี.ค. – 5 เม.ย. 2569
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 2,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค เทอม 2 ปี 2568 (ขอนแก่น)", period_name_en: "Final Exam Sem2 2025 (KKU)",
      period_start_date: d(2026, 3, 23), period_end_date: d(2026, 4, 5), sort_order: 2 },
    // ภาคฤดูร้อน ปลายภาค: 2 มิ.ย. – 5 มิ.ย. 2569
    { university_id: KHONKAEN, academic_year: 2568, academic_term_type_id: 3,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค ภาคฤดูร้อน ปี 2568 (ขอนแก่น)", period_name_en: "Final Exam Summer 2025 (KKU)",
      period_start_date: d(2026, 6, 2), period_end_date: d(2026, 6, 5), sort_order: 1 },

    // =====================================================
    // จุฬาลงกรณ์มหาวิทยาลัย (ทวิภาค)
    // =====================================================
    // เทอม 1 กลางภาค: 22–26 ก.ย. 2568
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 1,
      academic_period_type_id: 1,
      period_name_th: "สอบกลางภาค เทอม 1 ปี 2568 (จุฬาฯ)", period_name_en: "Midterm Exam Sem1 2025 (CU)",
      period_start_date: d(2025, 9, 22), period_end_date: d(2025, 9, 26), sort_order: 1 },
    // เทอม 1 ปลายภาค: 24 พ.ย. – 8 ธ.ค. 2568
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 1,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค เทอม 1 ปี 2568 (จุฬาฯ)", period_name_en: "Final Exam Sem1 2025 (CU)",
      period_start_date: d(2025, 11, 24), period_end_date: d(2025, 12, 8), sort_order: 2 },
    // เทอม 2 กลางภาค: 23–27 ก.พ. 2569
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 2,
      academic_period_type_id: 1,
      period_name_th: "สอบกลางภาค เทอม 2 ปี 2568 (จุฬาฯ)", period_name_en: "Midterm Exam Sem2 2025 (CU)",
      period_start_date: d(2026, 2, 23), period_end_date: d(2026, 2, 27), sort_order: 1 },
    // เทอม 2 ปลายภาค: 27 เม.ย. – 12 พ.ค. 2569
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 2,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค เทอม 2 ปี 2568 (จุฬาฯ)", period_name_en: "Final Exam Sem2 2025 (CU)",
      period_start_date: d(2026, 4, 27), period_end_date: d(2026, 5, 12), sort_order: 2 },
    // ภาคฤดูร้อน: ไม่มีสอบกลางภาค, สอบปลายภาค ~17 ก.ค. 2569 (ปิดเรียน–สอบ)
    { university_id: CHULA, academic_year: 2568, academic_term_type_id: 3,
      academic_period_type_id: 2,
      period_name_th: "สอบปลายภาค ภาคฤดูร้อน ปี 2568 (จุฬาฯ)", period_name_en: "Final Exam Summer 2025 (CU)",
      period_start_date: d(2026, 7, 13), period_end_date: d(2026, 7, 17), sort_order: 1 },
];

// ─────────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🔄  seed-real-academic-periods — เริ่มต้น\n");

    // ── Step 0: ตรวจ period type categories ─────────────────────────────
    const midType = await prisma.academicPeriodTypeCategory.findUnique({ where: { code: "MIDTERM_EXAM" } });
    const finType = await prisma.academicPeriodTypeCategory.findUnique({ where: { code: "FINAL_EXAM" } });
    if (!midType || !finType) {
        console.error("❌  ไม่พบ MIDTERM_EXAM / FINAL_EXAM ในตาราง academic_period_type_category");
        process.exit(1);
    }
    console.log(`  ✅  MIDTERM_EXAM id=${midType.academic_period_type_id}   FINAL_EXAM id=${finType.academic_period_type_id}\n`);

    // ── Step 1: Update academic_term dates ──────────────────────────────
    console.log("📅  Step 1: Update academic_term dates...\n");
    for (const t of termUpdates) {
        // Find the term by unique key
        const existing = await prisma.$queryRaw`
            SELECT academic_term_id FROM academic_term
            WHERE university_id = ${t.university_id}
            AND academic_term_type_id = ${t.academic_term_type_id}
            AND academic_year = ${t.academic_year}
            LIMIT 1
        ` as { academic_term_id: number }[];

        if (existing.length === 0) {
            console.log(`  ⚠️  ไม่พบ term univ=${t.university_id} year=${t.academic_year} type=${t.academic_term_type_id} — ข้าม`);
            continue;
        }

        const termId = existing[0].academic_term_id;
        await prisma.$executeRaw`
            UPDATE academic_term
            SET term_start_date = ${t.term_start_date}::date,
                term_end_date = ${t.term_end_date}::date
            WHERE academic_term_id = ${termId}
        `;
        console.log(`  ✏️  term_id=${termId} univ=${t.university_id} year=${t.academic_year} type=${t.academic_term_type_id} → ${fmt(t.term_start_date)} – ${fmt(t.term_end_date)}`);
    }

    // ── Step 2: Insert academic_period ───────────────────────────────────
    console.log("\n📝  Step 2: Insert academic_period records...\n");
    let inserted = 0;
    let skipped = 0;

    for (const p of periodInserts) {
        // Find the term
        const termRows = await prisma.$queryRaw`
            SELECT academic_term_id FROM academic_term
            WHERE university_id = ${p.university_id}
            AND academic_term_type_id = ${p.academic_term_type_id}
            AND academic_year = ${p.academic_year}
            LIMIT 1
        ` as { academic_term_id: number }[];

        if (termRows.length === 0) {
            console.log(`  ⚠️  ไม่พบ term — ข้าม: ${p.period_name_th}`);
            skipped++;
            continue;
        }
        const termId = termRows[0].academic_term_id;

        // Check if period already exists for this term + type
        const existingPeriod = await prisma.$queryRaw`
            SELECT period_id FROM academic_period
            WHERE academic_term_id = ${termId}
            AND academic_period_type_id = ${p.academic_period_type_id}
            LIMIT 1
        ` as { period_id: number }[];

        if (existingPeriod.length > 0) {
            console.log(`  ⏭️  มีอยู่แล้ว (period_id=${existingPeriod[0].period_id}): ${p.period_name_th}`);
            skipped++;
            continue;
        }

        await prisma.$executeRaw`
            INSERT INTO academic_period (
                academic_term_id, university_id, academic_period_type_id,
                period_name_th, period_name_en,
                period_start_date, period_end_date, sort_order
            ) VALUES (
                ${termId}, ${p.university_id}, ${p.academic_period_type_id},
                ${p.period_name_th}, ${p.period_name_en},
                ${p.period_start_date}::date, ${p.period_end_date}::date, ${p.sort_order}
            )
        `;
        console.log(`  ✅  ${p.period_name_th}  (${fmt(p.period_start_date)} – ${fmt(p.period_end_date)})`);
        inserted++;
    }

    console.log(`\n  📊  สรุป: สร้าง ${inserted} records, ข้าม ${skipped} records\n`);

    // ── Step 3: Verify ──────────────────────────────────────────────────
    const total = await prisma.academicPeriod.count();
    console.log(`  📊  Total academic_period count: ${total}\n`);

    const sample = await prisma.$queryRaw`
        SELECT ap.period_id, ap.period_name_th,
               ap.period_start_date, ap.period_end_date,
               ap.university_id,
               apt.code as type_code
        FROM academic_period ap
        JOIN academic_period_type_category apt ON ap.academic_period_type_id = apt.academic_period_type_id
        ORDER BY ap.university_id, ap.period_start_date
    ` as any[];

    console.log("  📌  ข้อมูลทั้งหมดที่มี:");
    sample.forEach((r: any) => {
        const start = r.period_start_date instanceof Date ? fmt(r.period_start_date) : r.period_start_date;
        const end = r.period_end_date instanceof Date ? fmt(r.period_end_date) : r.period_end_date;
        console.log(`     [${r.period_id}] univ=${r.university_id} ${r.type_code} ${start} – ${end} | ${r.period_name_th}`);
    });

    console.log("\n✅  เสร็จสิ้น!\n");
}

main()
    .catch(e => { console.error("❌ Error:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
