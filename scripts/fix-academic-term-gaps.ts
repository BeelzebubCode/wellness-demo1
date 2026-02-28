// scripts/fix-academic-term-gaps.ts
// Fix 97K bookings missing academic_term_id by extending term dates

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Add academic year 2561 terms
    const termTypes = await prisma.academicTermType.findMany();
    const universities = await prisma.university.findMany({ select: { university_id: true } });

    const termData: any[] = [];
    for (const uni of universities) {
        for (const tt of termTypes) {
            let startDate: Date, endDate: Date;
            switch (tt.academic_term_type_code) {
                case "SEM_1": startDate = new Date("2018-06-01"); endDate = new Date("2018-10-31"); break;
                case "SEM_2": startDate = new Date("2018-11-01"); endDate = new Date("2019-03-31"); break;
                case "SEM_3":
                case "SUMMER": startDate = new Date("2019-04-01"); endDate = new Date("2019-06-15"); break;
                default: startDate = new Date("2018-06-01"); endDate = new Date("2018-12-31");
            }
            termData.push({
                university_id: uni.university_id,
                academic_term_type_id: tt.academic_term_type_id,
                academic_year: 2561,
                term_start_date: startDate,
                term_end_date: endDate,
                is_active: false,
            });
        }
    }

    await prisma.academicTerm.createMany({ data: termData, skipDuplicates: true });
    console.log("Added", termData.length, "terms for year 2561");

    // Fix boundary gaps: make terms seamless
    // SEM_1: start Jun 1 (was Jun 16)
    // SEM_2: start Nov 1 (was Nov 17)
    // SEM_3/SUMMER: end Jun 15 (was Jun 6)
    await prisma.$executeRaw`
    UPDATE academic_term 
    SET term_start_date = DATE_TRUNC('month', term_start_date)::date
    WHERE academic_term_type_id IN (
      SELECT academic_term_type_id FROM academic_term_type 
      WHERE academic_term_type_code IN ('SEM_1', 'SEM_2')
    )
  `;

    await prisma.$executeRaw`
    UPDATE academic_term
    SET term_end_date = (term_end_date + interval '9 days')::date
    WHERE academic_term_type_id IN (
      SELECT academic_term_type_id FROM academic_term_type 
      WHERE academic_term_type_code IN ('SEM_3', 'SUMMER')
    )
    AND EXTRACT(DAY FROM term_end_date) = 6
  `;
    console.log("Fixed term date boundaries");

    // Re-assign academic_term_id for remaining bookings
    const updated = await prisma.$executeRaw`
    UPDATE booking b
    SET academic_term_id = at.term_id
    FROM time_slot ts, academic_term at
    WHERE b.time_slot_id = ts.time_slot_id
      AND b.university_id = ts.university_id
      AND ts.university_id = at.university_id
      AND ts.time_slot_start_datetime::date BETWEEN at.term_start_date AND at.term_end_date
      AND b.academic_term_id IS NULL
  `;
    console.log("Updated", updated, "bookings");

    const remaining = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*)::int as cnt FROM booking WHERE academic_term_id IS NULL
  `;
    console.log("Remaining without academic_term_id:", remaining[0].cnt);

    await prisma.$disconnect();
}

main().catch(console.error);
