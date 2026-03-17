import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function q(label: string, sql: string) {
  console.log(`\n--- ${label} ---`);
  try {
    const r = await prisma.$queryRawUnsafe(sql) as any[];
    for (const row of r) console.log(`  ${JSON.stringify(row)}`);
  } catch (e: any) { console.log(`  ERROR: ${e.message?.slice(0,120)}`); }
}

async function main() {
  console.log("=== DATABASE AUDIT (Raw SQL) ===\n");

  await q("9. FUTURE COMPLETED/NO_SHOW",
    `SELECT b.booking_status, COUNT(*) as cnt
     FROM booking b JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id
     WHERE ts.time_slot_start_datetime > NOW()
       AND b.booking_status IN ('COMPLETED','NO_SHOW')
     GROUP BY b.booking_status`);

  await q("10. PAST BOOKINGS STILL ACTIVE",
    `SELECT b.booking_status, COUNT(*) as cnt
     FROM booking b JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id
     WHERE ts.time_slot_end_datetime < NOW()
       AND b.booking_status IN ('PENDING_ASSIGNMENT','ASSIGNED','IN_PROGRESS')
     GROUP BY b.booking_status`);

  await q("11. ZERO-CAPACITY SLOTS", `SELECT COUNT(*) as cnt FROM time_slot WHERE time_slot_max_capacity = 0`);

  await q("12. SAMPLE STUDENTS",
    `SELECT s.student_id, a.first_name, a.last_name, a.email, s.student_code, s.student_year
     FROM student s JOIN account a ON s.account_id = a.account_id LIMIT 5`);

  await q("13. SAMPLE CONSULTANTS",
    `SELECT c.consultant_id, a.first_name, a.last_name, c.consultant_license_number
     FROM consultant c JOIN account a ON c.account_id = a.account_id LIMIT 5`);

  await q("14. LAST 10 BOOKINGS",
    `SELECT b.booking_id, b.booking_status, s.student_code,
            ts.time_slot_start_datetime, b.booking_created_at
     FROM booking b
     JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id
     LEFT JOIN student s ON b.student_id = s.student_id
     ORDER BY b.booking_created_at DESC LIMIT 10`);

  await q("15. DAY OF WEEK DISTRIBUTION",
    `SELECT EXTRACT(DOW FROM ts.time_slot_start_datetime) as dow, COUNT(*) as cnt
     FROM booking b JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id
     GROUP BY dow ORDER BY dow`);

  await q("16. PROBLEM CATEGORIES",
    `SELECT * FROM problem_category ORDER BY problem_category_id`);

  await q("17. BOOKINGS PER CATEGORY",
    `SELECT pc.problem_category_code, COUNT(*) as cnt
     FROM booking b LEFT JOIN problem_category pc ON b.problem_category_id = pc.problem_category_id
     GROUP BY pc.problem_category_code ORDER BY cnt DESC LIMIT 15`);

  await q("18. HOUR DISTRIBUTION",
    `SELECT EXTRACT(HOUR FROM ts.time_slot_start_datetime AT TIME ZONE 'Asia/Bangkok') as hour, COUNT(*) as cnt
     FROM booking b JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id
     GROUP BY hour ORDER BY hour`);

  await q("19. BOOKING CREATION TIMING",
    `SELECT
       COUNT(*) FILTER (WHERE ts.time_slot_start_datetime > b.booking_created_at + interval '1 day') as created_before,
       COUNT(*) FILTER (WHERE ts.time_slot_start_datetime BETWEEN b.booking_created_at - interval '1 day' AND b.booking_created_at + interval '1 day') as same_day,
       COUNT(*) FILTER (WHERE b.booking_created_at > ts.time_slot_start_datetime + interval '1 hour') as created_after_slot,
       MIN(ts.time_slot_start_datetime - b.booking_created_at) as min_diff,
       MAX(ts.time_slot_start_datetime - b.booking_created_at) as max_diff
     FROM booking b JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id
     WHERE b.booking_status = 'COMPLETED' LIMIT 1`);

  await q("20. BOOKINGS BY YEAR",
    `SELECT EXTRACT(YEAR FROM b.booking_created_at) as year, COUNT(*) as cnt
     FROM booking b GROUP BY year ORDER BY year`);

  await q("21. STUDENT YEAR DISTRIBUTION",
    `SELECT student_year, COUNT(*) as cnt FROM student GROUP BY student_year ORDER BY student_year`);

  await q("22. CANCELLED REASON CHECK",
    `SELECT booking_cancel_reason, COUNT(*) as cnt FROM booking
     WHERE booking_status = 'CANCELLED' GROUP BY booking_cancel_reason ORDER BY cnt DESC LIMIT 10`);

  await q("23. BOOKING DETAIL TEXT SAMPLES",
    `SELECT booking_detail_text, COUNT(*) as cnt FROM booking
     WHERE booking_detail_text IS NOT NULL
     GROUP BY booking_detail_text ORDER BY cnt DESC LIMIT 10`);

  await q("24. ACCOUNTS WITHOUT STUDENT/CONSULTANT",
    `SELECT a.role, COUNT(*) as cnt FROM account a
     LEFT JOIN student s ON a.student_id = s.student_id
     LEFT JOIN consultant c ON a.consultant_id = c.consultant_id
     WHERE (a.role = 'STUDENT' AND s.student_id IS NULL)
        OR (a.role = 'CONSULTANT' AND c.consultant_id IS NULL)
     GROUP BY a.role`);

  await q("25. DUPLICATE EMAILS",
    `SELECT email, COUNT(*) as cnt FROM account GROUP BY email HAVING COUNT(*) > 1 LIMIT 5`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
