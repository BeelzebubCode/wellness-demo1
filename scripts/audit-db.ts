// Data Audit Script — query wellness_db for anomalies
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== DATABASE DATA AUDIT ===\n");

  // 1. Table row counts
  console.log("--- 1. TABLE ROW COUNTS ---");
  const counts: Record<string, number> = {};
  counts.universities = await prisma.university.count();
  counts.students = await prisma.student.count();
  counts.accounts = await prisma.account.count();
  counts.consultants = await prisma.consultant.count();
  counts.advisors = await prisma.advisor.count();
  counts.bookings = await prisma.booking.count();
  counts.timeSlots = await prisma.timeSlot.count();
  counts.faculties = await prisma.faculty.count();
  counts.departments = await prisma.department.count();
  counts.provinces = await prisma.province.count();
  counts.regions = await prisma.region.count();
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k}: ${v}`);
  }

  // 2. Booking status distribution
  console.log("\n--- 2. BOOKING STATUS DISTRIBUTION ---");
  const bookingStatuses = await prisma.booking.groupBy({
    by: ["booking_status"],
    _count: { _all: true },
    orderBy: { _count: { booking_id: "desc" } },
  });
  for (const s of bookingStatuses) {
    console.log(`  ${s.booking_status}: ${s._count._all}`);
  }

  // 3. Bookings by date range
  console.log("\n--- 3. BOOKING DATE RANGE ---");
  const minBooking = await prisma.booking.findFirst({ orderBy: { booking_created_at: "asc" }, select: { booking_created_at: true } });
  const maxBooking = await prisma.booking.findFirst({ orderBy: { booking_created_at: "desc" }, select: { booking_created_at: true } });
  console.log(`  Earliest: ${minBooking?.booking_created_at}`);
  console.log(`  Latest:   ${maxBooking?.booking_created_at}`);

  // 4. Time slots date range
  console.log("\n--- 4. TIME SLOT DATE RANGE ---");
  const minSlot = await prisma.timeSlot.findFirst({ orderBy: { time_slot_start_datetime: "asc" }, select: { time_slot_start_datetime: true } });
  const maxSlot = await prisma.timeSlot.findFirst({ orderBy: { time_slot_start_datetime: "desc" }, select: { time_slot_start_datetime: true } });
  console.log(`  Earliest: ${minSlot?.time_slot_start_datetime}`);
  console.log(`  Latest:   ${maxSlot?.time_slot_start_datetime}`);

  // 5. Bookings per university
  console.log("\n--- 5. BOOKINGS PER UNIVERSITY ---");
  const bookingsPerUni = await prisma.booking.groupBy({
    by: ["university_id"],
    _count: { _all: true },
    orderBy: { _count: { booking_id: "desc" } },
  });
  for (const b of bookingsPerUni.slice(0, 10)) {
    const uni = await prisma.university.findUnique({ where: { university_id: b.university_id }, select: { university_name_th: true } });
    console.log(`  [${b.university_id}] ${uni?.university_name_th}: ${b._count._all}`);
  }

  // 6. Students per university
  console.log("\n--- 6. STUDENTS PER UNIVERSITY ---");
  const studentsPerUni = await prisma.student.groupBy({
    by: ["university_id"],
    _count: { _all: true },
    orderBy: { _count: { student_id: "desc" } },
  });
  for (const s of studentsPerUni.slice(0, 10)) {
    const uni = await prisma.university.findUnique({ where: { university_id: s.university_id }, select: { university_name_th: true } });
    console.log(`  [${s.university_id}] ${uni?.university_name_th}: ${s._count._all}`);
  }

  // 7. Consultants per university
  console.log("\n--- 7. CONSULTANTS PER UNIVERSITY ---");
  const consultantsPerUni = await prisma.consultant.groupBy({
    by: ["university_id"],
    _count: { _all: true },
    orderBy: { _count: { consultant_id: "desc" } },
  });
  for (const c of consultantsPerUni.slice(0, 10)) {
    const uni = await prisma.university.findUnique({ where: { university_id: c.university_id }, select: { university_name_th: true } });
    console.log(`  [${c.university_id}] ${uni?.university_name_th}: ${c._count._all}`);
  }

  // 8. Account role distribution
  console.log("\n--- 8. ACCOUNT ROLE DISTRIBUTION ---");
  const roles = await prisma.account.groupBy({
    by: ["role"],
    _count: { _all: true },
    orderBy: { _count: { account_id: "desc" } },
  });
  for (const r of roles) {
    console.log(`  ${r.role}: ${r._count._all}`);
  }

  // 9. Anomaly: Bookings in future with COMPLETED status
  console.log("\n--- 9. ANOMALY: FUTURE BOOKINGS WITH COMPLETED/NO_SHOW ---");
  const now = new Date();
  const futureCompleted = await prisma.booking.count({
    where: {
      timeSlot: { time_slot_start_datetime: { gt: now } },
      booking_status: { in: ["COMPLETED", "NO_SHOW"] },
    },
  });
  console.log(`  Future completed/no_show bookings: ${futureCompleted}`);

  // 10. Anomaly: Past bookings still PENDING
  console.log("\n--- 10. ANOMALY: PAST BOOKINGS STILL PENDING ---");
  const pastPending = await prisma.booking.count({
    where: {
      timeSlot: { time_slot_end_datetime: { lt: now } },
      booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] },
    },
  });
  console.log(`  Past bookings still active/pending: ${pastPending}`);

  // 11. Anomaly: Time slots with 0 capacity
  console.log("\n--- 11. ANOMALY: TIME SLOTS WITH 0 CAPACITY ---");
  const zeroCapSlots = await prisma.timeSlot.count({
    where: { time_slot_max_capacity: 0 },
  });
  console.log(`  Slots with 0 max capacity: ${zeroCapSlots}`);

  // 12. Sample student data quality
  console.log("\n--- 12. SAMPLE STUDENTS (first 5) ---");
  const sampleStudents = await prisma.student.findMany({
    take: 5,
    include: { account: { select: { first_name: true, last_name: true, email: true, role: true } } },
  });
  for (const s of sampleStudents) {
    console.log(`  [${s.student_id}] ${s.account.first_name} ${s.account.last_name} | email: ${s.account.email} | code: ${s.student_code} | year: ${s.student_year}`);
  }

  // 13. Sample consultant data
  console.log("\n--- 13. SAMPLE CONSULTANTS (first 5) ---");
  const sampleConsultants = await prisma.consultant.findMany({
    take: 5,
    include: { account: { select: { first_name: true, last_name: true, email: true } } },
  });
  for (const c of sampleConsultants) {
    console.log(`  [${c.consultant_id}] ${c.account.first_name} ${c.account.last_name} | email: ${c.account.email} | license: ${c.consultant_license_number}`);
  }

  // 14. Sample booking data with time details
  console.log("\n--- 14. SAMPLE BOOKINGS (last 10) ---");
  const sampleBookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { booking_created_at: "desc" },
    include: {
      timeSlot: { select: { time_slot_start_datetime: true, time_slot_end_datetime: true } },
      student: { select: { student_code: true } },
    },
  });
  for (const b of sampleBookings) {
    console.log(`  [${b.booking_id}] status: ${b.booking_status} | student: ${b.student?.student_code} | slot: ${b.timeSlot.time_slot_start_datetime?.toISOString()} - ${b.timeSlot.time_slot_end_datetime?.toISOString()} | created: ${b.booking_created_at?.toISOString()}`);
  }

  // 15. Booking distribution by day of week
  console.log("\n--- 15. BOOKING SLOT DAY-OF-WEEK (sample 500) ---");
  const bookingSlots = await prisma.booking.findMany({
    take: 500,
    include: { timeSlot: { select: { time_slot_start_datetime: true } } },
  });
  const dayCount: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const b of bookingSlots) {
    const d = b.timeSlot.time_slot_start_datetime.getDay();
    dayCount[dayNames[d]]++;
  }
  for (const [k, v] of Object.entries(dayCount)) {
    console.log(`  ${k}: ${v}`);
  }

  // 16. University data
  console.log("\n--- 16. UNIVERSITIES ---");
  const unis = await prisma.university.findMany({
    take: 20,
    include: { province: { select: { province_name_th: true } } },
  });
  for (const u of unis) {
    console.log(`  [${u.university_id}] ${u.university_name_th} | province: ${u.province.province_name_th} | active: ${u.university_is_active}`);
  }

  // 17. Problem categories
  console.log("\n--- 17. PROBLEM CATEGORIES ---");
  const cats = await prisma.problemCategory.findMany({ take: 20 });
  for (const c of cats) {
    console.log(`  [${c.problem_category_id}] ${c.problem_category_code} | ${c.problem_category_name_th}`);
  }

  // 18. Bookings per problem category
  console.log("\n--- 18. BOOKINGS PER PROBLEM CATEGORY ---");
  const bookingsByCat = await prisma.booking.groupBy({
    by: ["problem_category_id"],
    _count: { _all: true },
    orderBy: { _count: { booking_id: "desc" } },
  });
  for (const b of bookingsByCat.slice(0, 15)) {
    const cat = b.problem_category_id ? await prisma.problemCategory.findUnique({ where: { problem_category_id: b.problem_category_id } }) : null;
    console.log(`  ${cat?.problem_category_code || 'NULL'}: ${b._count._all}`);
  }

  // 19. Duplicate student codes
  console.log("\n--- 19. DUPLICATE STUDENT CODES ---");
  const studentCodes = await prisma.student.groupBy({
    by: ["student_code"],
    _count: { _all: true },
    having: { student_code: { _count: { gt: 1 } } },
  });
  console.log(`  Duplicate student codes: ${studentCodes.length}`);
  for (const s of studentCodes.slice(0, 5)) {
    console.log(`    ${s.student_code}: ${s._count._all}x`);
  }

  // 20. Students without bookings
  console.log("\n--- 20. STUDENTS WITHOUT BOOKINGS ---");
  const studentsWithBookings = await prisma.booking.groupBy({ by: ["student_id"] });
  const studentIds = new Set(studentsWithBookings.map(b => b.student_id));
  const totalStudents = await prisma.student.count();
  console.log(`  Total students: ${totalStudents}`);
  console.log(`  Students with bookings: ${studentIds.size}`);
  console.log(`  Students without bookings: ${totalStudents - studentIds.size}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
