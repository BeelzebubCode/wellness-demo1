// prisma/seed.ts
import { PrismaClient, BookingStatus } from "@prisma/client";

import { clearDatabase } from "./seeds/00-clear";
import { seedReferenceTables } from "./seeds/00-reference-tables";
import { seedGeo } from "./seeds/01-geo";
import { seedStatic } from "./seeds/02-static";
import { seedFacultiesDepartments } from "./seeds/03-faculty";
import { seedAdvisors } from "./seeds/04-advisor";
import { seedAccounts } from "./seeds/05-accounts";
import { seedConsultants } from "./seeds/06-consultants";
import { seedStudents } from "./seeds/07-students";
import { seedTimeSlots } from "./seeds/08-timeslots";
import { seedBookings } from "./seeds/09-bookings";
import { seedUniversityTypes } from "./seeds/10-university-types";
import { seedUniversityConnections } from "./seeds/11-university-connections";
import { seedManualConnections } from "./seeds/12-manual-connections";
import { seedDeans } from "./seeds/13-deans";
import { seedDayPeriods } from "./seeds/18-day-periods";
import { seedHeadDepartments } from "./seeds/seed-head-department";


const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seeding...\n");

  // ⚡ PostgreSQL Turbo Mode — safe for seeding (re-runnable)
  console.log("⚡ Enabling PostgreSQL turbo mode...");
  await prisma.$executeRawUnsafe(`SET synchronous_commit = OFF`);     // skip fsync per txn → 3-5x faster
  await prisma.$executeRawUnsafe(`SET work_mem = '256MB'`);           // faster sorts/joins
  await prisma.$executeRawUnsafe(`SET maintenance_work_mem = '512MB'`); // faster index builds
  console.log("   ✅ Turbo mode enabled (synchronous_commit=OFF, work_mem=256MB)\n");

  await clearDatabase(prisma);

  // Must seed reference tables FIRST — student/address seeds depend on FK lookups
  await seedReferenceTables(prisma);

  const geo = await seedGeo(prisma); // regions, provinces, universities
  const st = await seedStatic(prisma); // status, org, categories, criteria, templates, pointRule, passwordHash, plainPassword

  const acad = await seedFacultiesDepartments(prisma, {
    universities: geo.universities,
  });

  const advisors = await seedAdvisors(prisma, {
    universities: geo.universities,
    passwordHash: st.passwordHash,
  });

  const deans = await seedDeans(prisma, {
    universities: geo.universities,
    
    passwordHash: st.passwordHash,
  });

  const headDepts = await seedHeadDepartments(prisma, {
    universities: geo.universities,
    passwordHash: st.passwordHash,
  });

  const accounts = await seedAccounts(prisma, {
    universities: geo.universities,
    org: st.org,
    passwordHash: st.passwordHash,
  });

  const consultants = await seedConsultants(prisma, {
    universities: geo.universities,
    org: st.org,
    passwordHash: st.passwordHash,
  });

  const students = await seedStudents(prisma, {
    universities: geo.universities,
    provinces: geo.provinces,
    deptList: Array.from(acad.deptByUniAndCode.values()),
    advisors,
    statusActive: st.statusActive,
    statusInactive: st.statusInactive,
    passwordHash: st.passwordHash,
  });

  const hours = await seedDayPeriods(prisma, { universities: geo.universities });
  const timeSlots = await seedTimeSlots(prisma, { universities: geo.universities });

  const isQuickMode = process.env.SEED_QUICK_MODE === "true";
  const isDevMode = process.env.SEED_DEV_MODE === "true";

  const completedCount = isQuickMode ? 5000 : (isDevMode ? 50000 : 2000000);
  const cancelledCount = isQuickMode ? 500 : (isDevMode ? 5000 : 300000);

  const bookingPlan: { status: BookingStatus; count: number }[] = [
    { status: BookingStatus.COMPLETED, count: completedCount },
    { status: BookingStatus.IN_PROGRESS, count: 0 },
    { status: BookingStatus.PENDING_ASSIGNMENT, count: 5000 },
    { status: BookingStatus.CANCELLED, count: cancelledCount },
  ];

  await seedBookings(prisma, {
    universities: geo.universities,
    students,
    consultants: consultants.consultants,
    timeSlotsByUniId: timeSlots.timeSlotsByUniId,
    problemCategories: st.problemCategories,
    criteria: st.criteria,
    headAccountIdByUniversityId: accounts.headAccountIdByUniversityId,
    tplCreated: st.tplCreated,
    tplAssigned: st.tplAssigned,
    pointRules: st.pointRules,
    pointAmount: st.pointAmount,
    consultantBiasById: consultants.consultantBiasById,
    bookingPlan,
    onlineChannels: st.onlineChannels,
    cancellationReasons: st.cancellationReasons,
  });

  console.log("\\n🏛️  Seeding university types...");
  await seedUniversityTypes(prisma);

  console.log("\\n🌐 Seeding university connections...");
  await seedUniversityConnections(prisma);
  await seedManualConnections(prisma);



  // =========================
  // Summary (รองรับทุกมหาลัย)
  // =========================
  console.log("\n\x1b[32m✅ Database seeding completed successfully!\x1b[0m\n");
  console.log("\x1b[1m\x1b[36m📊 Summary of Generated Data:\x1b[0m");
  console.log("\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");

  const uniCount = geo.universities.length;
  const headCount = accounts.headAccountIdByUniversityId.size;
  const rectorCount = uniCount;
  const consultantCount = consultants.consultants.length;
  const studentCount = students.length;

  console.log(`\x1b[34m🏫 Universities:\x1b[0m \x1b[1m${uniCount}\x1b[0m`);
  console.log(`\x1b[33m👑 Head Consultants:\x1b[0m \x1b[1m${headCount}\x1b[0m \x1b[90m(head_{university_code})\x1b[0m`);
  console.log(`\x1b[35m🏛️  Rectors:\x1b[0m \x1b[1m${rectorCount}\x1b[0m \x1b[90m(rector_{university_code})\x1b[0m`);
  console.log(`\x1b[36m🏛️  Ministry:\x1b[0m \x1b[1m1\x1b[0m \x1b[90m(ministry_admin)\x1b[0m`);
  console.log(`\x1b[31m🛡️  Super Admin:\x1b[0m \x1b[1m1\x1b[0m \x1b[90m(superAdmin)\x1b[0m`);
  console.log(`\x1b[32m👨‍🏫 Advisors:\x1b[0m \x1b[1m${advisors.length}\x1b[0m \x1b[90m(advisor_{uni}_{dept})\x1b[0m`);
  console.log(`\x1b[35m👔 Deans:\x1b[0m \x1b[1m${deans.length}\x1b[0m \x1b[90m(dean_{uni}_{faculty})\x1b[0m`);
  console.log(`\x1b[34m💼 Consultants:\x1b[0m \x1b[1m${consultantCount}\x1b[0m \x1b[90m(consultant_{university_code}_1..5)\x1b[0m`);
  const studentCountLog = isDevMode 
    ? `${geo.universities.length * 30} \x1b[90m(Dev Mode: 30/uni)\x1b[0m` 
    : `~1.8M \x1b[90m(Full Scale)\x1b[0m`;

  console.log(`\x1b[32m🎓 Students:\x1b[0m \x1b[1m${studentCountLog}\x1b[0m`);

  // =========================
  // Credentials (รองรับทุกมหาลัย)
  // =========================
  console.log("\n\x1b[1m\x1b[33m🔑 Login Credentials:\x1b[0m");
  console.log("   \x1b[36mMinistry:\x1b[0m   ministry_admin");
  console.log("   \x1b[33mHead:\x1b[0m       head_{university_code}");
  console.log("   \x1b[35mRector:\x1b[0m     rector_{university_code}");
  console.log("   \x1b[31mSuper:\x1b[0m      superAdmin");
  console.log("   \x1b[32mAdvisor:\x1b[0m    advisor_{uni}_{dept} \x1b[90m(e.g. advisor_cu_cse)\x1b[0m");
  console.log("   \x1b[35mDean:\x1b[0m       dean_{uni}_{faculty} \x1b[90m(e.g. dean_cu_eng)\x1b[0m");
  console.log("   \x1b[34mConsultant:\x1b[0m consultant_{university_code}_1 .. _5");
  console.log("   \x1b[32mStudent:\x1b[0m    stu_{university_code}_01 .. _30");
  console.log(`   \x1b[1mPassword:\x1b[0m   \x1b[32m${st.plainPassword}\x1b[0m`);
  console.log("\n\x1b[90m💡 Note: Bookings were created intelligently across all students.\x1b[0m\n");

  // silence unused warning
  void accounts.superAccount;
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
