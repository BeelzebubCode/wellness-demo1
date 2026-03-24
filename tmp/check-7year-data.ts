import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 7-YEAR DATA VERIFICATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Booking count per year + status breakdown
  console.log('📅 1. BOOKING COUNT PER YEAR & STATUS');
  const bookingsByYear: any[] = await prisma.$queryRaw`
    SELECT 
      EXTRACT(YEAR FROM booking_created_at)::int AS year,
      booking_status,
      COUNT(*)::int AS cnt
    FROM booking
    GROUP BY year, booking_status
    ORDER BY year, booking_status;
  `;
  
  // Group by year
  const yearMap = new Map<number, any>();
  for (const r of bookingsByYear) {
    if (!yearMap.has(r.year)) yearMap.set(r.year, { total: 0 });
    yearMap.get(r.year)[r.booking_status] = r.cnt;
    yearMap.get(r.year).total += r.cnt;
  }
  
  for (const [year, data] of [...yearMap.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${year}: Total=${data.total?.toLocaleString() || 0} | COMPLETED=${data.COMPLETED?.toLocaleString() || 0} | CANCELLED=${data.CANCELLED?.toLocaleString() || 0} | PENDING_ASSIGNMENT=${data.PENDING_ASSIGNMENT?.toLocaleString() || 0}`);
  }
  
  // Total bookings
  const totalBookings = [...yearMap.values()].reduce((s, d) => s + d.total, 0);
  console.log(`  ─── TOTAL: ${totalBookings.toLocaleString()} bookings\n`);

  // 2. Check for years with zero data (the 7 years = 2019-2025)
  console.log('📅 2. MISSING YEARS CHECK (2019-2025)');
  const expectedYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const actualYears = [...yearMap.keys()].sort();
  const missingYears = expectedYears.filter(y => !actualYears.includes(y));
  if (missingYears.length > 0) {
    console.log(`  ⚠️  MISSING DATA FOR YEARS: ${missingYears.join(', ')}`);
  } else {
    console.log(`  ✅ All 7 years have data (${expectedYears.join(', ')})`);
  }
  const extraYears = actualYears.filter(y => !expectedYears.includes(y));
  if (extraYears.length > 0) {
    console.log(`  ℹ️  Extra years found: ${extraYears.join(', ')}`);
  }
  console.log('');

  // 3. Related tables integrity check
  console.log('📋 3. RELATED TABLES DATA CHECK');
  
  const checks = [
    { name: 'booking_cancellation', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM booking_cancellation` },
    { name: 'booking_assignment', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM booking_assignment` },
    { name: 'booking_session', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM booking_session` },
    { name: 'booking_outcome', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM booking_outcome` },
    { name: 'booking_agreement_signature', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM booking_agreement_signature` },
    { name: 'booking_attendance', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM booking_attendance` },
    { name: 'feedback', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM feedback` },
    { name: 'feedback_rating', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM feedback_rating` },
    { name: 'feedback_comment', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM feedback_comment` },
    { name: 'student_point_transaction', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM student_point_transaction` },
    { name: 'student_point_wallet', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM student_point_wallet` },
    { name: 'notification', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM notification` },
    { name: 'booking_exception_request', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM booking_exception_request` },
    { name: 'discipline_log', query: prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM discipline_log` },
  ];

  for (const { name, query } of checks) {
    try {
      const result: any[] = await query;
      const cnt = result[0]?.cnt || 0;
      const icon = cnt > 0 ? '✅' : '⚠️ ';
      console.log(`  ${icon} ${name}: ${cnt.toLocaleString()}`);
    } catch (e: any) {
      console.log(`  ❌ ${name}: ERROR - ${e.message?.substring(0, 80)}`);
    }
  }
  console.log('');

  // 4. Orphan / anomaly checks
  console.log('🔍 4. ANOMALY CHECKS');
  
  // 4a. COMPLETED bookings without consultant
  const completedNoConsultant: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM booking WHERE booking_status = 'COMPLETED' AND consultant_id IS NULL;
  `;
  console.log(`  ${completedNoConsultant[0].cnt > 0 ? '⚠️' : '✅'} COMPLETED without consultant: ${completedNoConsultant[0].cnt.toLocaleString()}`);

  // 4b. COMPLETED bookings without outcome
  const completedNoOutcome: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM booking b
    WHERE b.booking_status = 'COMPLETED'
    AND NOT EXISTS (SELECT 1 FROM booking_outcome bo WHERE bo.university_id=b.university_id AND bo.booking_id=b.booking_id);
  `;
  console.log(`  ${completedNoOutcome[0].cnt > 0 ? '⚠️' : '✅'} COMPLETED without outcome: ${completedNoOutcome[0].cnt.toLocaleString()}`);

  // 4c. CANCELLED bookings without cancellation record
  const cancelledNoCancellation: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM booking b
    WHERE b.booking_status = 'CANCELLED'
    AND NOT EXISTS (SELECT 1 FROM booking_cancellation bc WHERE bc.university_id=b.university_id AND bc.booking_id=b.booking_id);
  `;
  console.log(`  ${cancelledNoCancellation[0].cnt > 0 ? '⚠️' : '✅'} CANCELLED without cancellation record: ${cancelledNoCancellation[0].cnt.toLocaleString()}`);

  // 4d. Future bookings (created after now)
  const futureBookings: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM booking WHERE booking_created_at > NOW();
  `;
  console.log(`  ${futureBookings[0].cnt > 0 ? '⚠️' : '✅'} Future bookings (created_at > NOW): ${futureBookings[0].cnt.toLocaleString()}`);

  // 4e. Bookings with NULL problem_category
  const nullProblem: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM booking WHERE problem_category_id IS NULL;
  `;
  console.log(`  ${nullProblem[0].cnt > 0 ? '⚠️' : '✅'} Bookings with NULL problem_category: ${nullProblem[0].cnt.toLocaleString()}`);

  // 4f. Booking per university distribution
  console.log('\n📊 5. BOOKINGS PER UNIVERSITY (Top 10 & Bottom 5)');
  const uniDist: any[] = await prisma.$queryRaw`
    SELECT u.university_name_th, COUNT(b.booking_id)::int AS cnt
    FROM university u
    LEFT JOIN booking b ON u.university_id = b.university_id
    GROUP BY u.university_id, u.university_name_th
    ORDER BY cnt DESC;
  `;
  
  console.log('  Top 10:');
  for (const row of uniDist.slice(0, 10)) {
    console.log(`    ${row.university_name_th}: ${row.cnt.toLocaleString()}`);
  }
  console.log('  Bottom 5:');
  for (const row of uniDist.slice(-5)) {
    console.log(`    ${row.university_name_th}: ${row.cnt.toLocaleString()}`);
  }

  // 5. Problem category distribution
  console.log('\n📊 6. PROBLEM CATEGORY DISTRIBUTION');
  const pcDist: any[] = await prisma.$queryRaw`
    SELECT pc.problem_category_code, pc.problem_category_name_th, COUNT(b.booking_id)::int AS cnt
    FROM problem_category pc
    LEFT JOIN booking b ON pc.problem_category_id = b.problem_category_id
    GROUP BY pc.problem_category_id, pc.problem_category_code, pc.problem_category_name_th
    ORDER BY cnt DESC;
  `;
  for (const row of pcDist) {
    console.log(`  ${row.problem_category_code}: ${row.cnt.toLocaleString()} (${row.problem_category_name_th})`);
  }

  // 6. Academic terms/periods check
  console.log('\n📊 7. ACADEMIC TERMS & PERIODS');
  const termCount: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM academic_term`;
  const periodCount: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM academic_period`;
  console.log(`  Academic terms: ${termCount[0].cnt}`);
  console.log(`  Academic periods: ${periodCount[0].cnt}`);

  // Check booking linkage to academic terms
  const bookingsWithTerm: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM booking WHERE academic_term_id IS NOT NULL;
  `;
  const bookingsWithSeason: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM booking WHERE season_id IS NOT NULL;
  `;
  console.log(`  Bookings with academic_term: ${bookingsWithTerm[0].cnt.toLocaleString()}`);
  console.log(`  Bookings with season: ${bookingsWithSeason[0].cnt.toLocaleString()}`);

  // 7. Students, Consultants, Time Slots
  console.log('\n📊 8. CORE ENTITY COUNTS');
  const students: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM student`;
  const consultants: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM consultant`;
  const timeSlots: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM time_slot`;
  const universities: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM university`;
  console.log(`  Universities: ${universities[0].cnt}`);
  console.log(`  Students: ${students[0].cnt.toLocaleString()}`);
  console.log(`  Consultants: ${consultants[0].cnt.toLocaleString()}`);
  console.log(`  Time slots: ${timeSlots[0].cnt.toLocaleString()}`);

  // 8. Monthly distribution for recent year (check for gaps)
  console.log('\n📊 9. MONTHLY DISTRIBUTION (2024-2025) - Check for gaps');
  const monthlyDist: any[] = await prisma.$queryRaw`
    SELECT 
      EXTRACT(YEAR FROM booking_created_at)::int AS yr,
      EXTRACT(MONTH FROM booking_created_at)::int AS mo,
      COUNT(*)::int AS cnt
    FROM booking 
    WHERE EXTRACT(YEAR FROM booking_created_at) IN (2024, 2025)
    GROUP BY yr, mo
    ORDER BY yr, mo;
  `;
  let lastYr = 0;
  for (const row of monthlyDist) {
    if (row.yr !== lastYr) { console.log(`  --- ${row.yr} ---`); lastYr = row.yr; }
    console.log(`    Month ${String(row.mo).padStart(2, '0')}: ${row.cnt.toLocaleString()}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ VERIFICATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
