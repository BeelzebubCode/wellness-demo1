// scripts/verify-7year-bookings.ts — Verify 7-year booking data quality
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Verifying 7-Year Booking Data\n');

  // 1. Total
  const total: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as n FROM booking`);
  console.log(`📌 Total Bookings: ${total[0].n.toLocaleString()}\n`);

  // 2. Date range & future check
  console.log('📅 Date Range:');
  const range: any[] = await prisma.$queryRawUnsafe(`
    SELECT MIN(booking_created_at) as first_booking,
           MAX(booking_created_at) as last_booking,
           COUNT(*) FILTER (WHERE booking_created_at > NOW()) AS future_bookings,
           AGE(MAX(booking_created_at), MIN(booking_created_at))::text as span
    FROM booking`);
  console.log(`   First: ${range[0].first_booking}`);
  console.log(`   Last:  ${range[0].last_booking}`);
  console.log(`   Span:  ${JSON.stringify(range[0].span)}`);
  console.log(`   ⚠️  Future bookings (>NOW()): ${range[0].future_bookings}`);

  // 3. Time slot range check
  console.log('\n⏰ Time Slot Range:');
  const tsRange: any[] = await prisma.$queryRawUnsafe(`
    SELECT MIN(time_slot_start_datetime) as first_slot,
           MAX(time_slot_start_datetime) as last_slot,
           COUNT(*) FILTER (WHERE time_slot_start_datetime > NOW()) AS future_slots
    FROM time_slot
    WHERE time_slot_id IN (SELECT time_slot_id FROM booking)`);
  console.log(`   First slot: ${tsRange[0].first_slot}`);
  console.log(`   Last slot:  ${tsRange[0].last_slot}`);
  console.log(`   ⚠️  Future slots used: ${tsRange[0].future_slots}`);

  // 4. Yearly
  console.log('\n📅 Yearly Distribution:');
  const yearly: any[] = await prisma.$queryRawUnsafe(`
    SELECT EXTRACT(YEAR FROM booking_created_at)::int AS year, COUNT(*)::int as n
    FROM booking GROUP BY year ORDER BY year`);
  for (const r of yearly) console.log(`   ${r.year}: ${r.n.toLocaleString()}`);

  // 5. Status
  console.log('\n📋 Status Distribution:');
  const statuses: any[] = await prisma.$queryRawUnsafe(`
    SELECT booking_status, COUNT(*)::int as n,
      ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 1) as pct
    FROM booking GROUP BY booking_status ORDER BY n DESC`);
  for (const r of statuses) console.log(`   ${r.booking_status}: ${r.n.toLocaleString()} (${r.pct}%)`);

  // 6. Problem categories
  console.log('\n🧩 Problem Category Distribution:');
  const cats: any[] = await prisma.$queryRawUnsafe(`
    SELECT pc.problem_category_code, COUNT(*)::int as n,
      ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 1) as pct
    FROM booking b JOIN problem_category pc ON b.problem_category_id = pc.problem_category_id
    GROUP BY pc.problem_category_code ORDER BY n DESC`);
  for (const r of cats) console.log(`   ${r.problem_category_code.padEnd(8)} ${r.n.toLocaleString().padStart(12)} (${r.pct}%)`);

  // 7. ALL related tables
  console.log('\n🔗 Related Tables (14 targets):');
  const tables: any[] = await prisma.$queryRawUnsafe(`
    SELECT 'booking' as tbl, COUNT(*)::int as n FROM booking
    UNION ALL SELECT 'booking_cancellation', COUNT(*)::int FROM booking_cancellation
    UNION ALL SELECT 'booking_assignment', COUNT(*)::int FROM booking_assignment
    UNION ALL SELECT 'booking_session', COUNT(*)::int FROM booking_session
    UNION ALL SELECT 'booking_outcome', COUNT(*)::int FROM booking_outcome
    UNION ALL SELECT 'booking_agreement_signature', COUNT(*)::int FROM booking_agreement_signature
    UNION ALL SELECT 'booking_attendance', COUNT(*)::int FROM booking_attendance
    UNION ALL SELECT 'feedback', COUNT(*)::int FROM feedback
    UNION ALL SELECT 'feedback_rating', COUNT(*)::int FROM feedback_rating
    UNION ALL SELECT 'feedback_comment', COUNT(*)::int FROM feedback_comment
    UNION ALL SELECT 'student_point_transaction', COUNT(*)::int FROM student_point_transaction
    UNION ALL SELECT 'student_point_wallet', COUNT(*)::int FROM student_point_wallet
    UNION ALL SELECT 'notification', COUNT(*)::int FROM notification
    UNION ALL SELECT 'booking_exception_request', COUNT(*)::int FROM booking_exception_request
    UNION ALL SELECT 'booking_discipline_log', COUNT(*)::int FROM booking_discipline_log
    ORDER BY n DESC`);
  for (const r of tables) console.log(`   ${r.tbl.padEnd(30)} ${r.n.toLocaleString().padStart(12)}`);

  // 8. Attendance distribution
  console.log('\n🏫 Attendance Status Distribution:');
  const att: any[] = await prisma.$queryRawUnsafe(`
    SELECT booking_attendance_status, COUNT(*)::int as n,
      ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 1) as pct
    FROM booking_attendance GROUP BY booking_attendance_status ORDER BY n DESC`);
  for (const r of att) console.log(`   ${r.booking_attendance_status}: ${r.n.toLocaleString()} (${r.pct}%)`);

  // 9. Monthly check for 2026 — latest months
  console.log('\n📅 Monthly Distribution (2025-2026):');
  const monthly: any[] = await prisma.$queryRawUnsafe(`
    SELECT TO_CHAR(booking_created_at, 'YYYY-MM') AS month, COUNT(*)::int as n
    FROM booking
    WHERE booking_created_at >= '2025-01-01'
    GROUP BY month ORDER BY month`);
  for (const r of monthly) console.log(`   ${r.month}: ${r.n.toLocaleString()}`);

  console.log('\n✅ Verification Complete!');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
