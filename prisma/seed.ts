// prisma/seed.ts
import { PrismaClient, BookingStatus } from "@prisma/client";

import { clearDatabase } from "./seeds/00-clear";
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
  console.log("\\n✅ Database seeding completed successfully!\\n");
  console.log("📊 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const uniCount = geo.universities.length;
  const headCount = accounts.headAccountIdByUniversityId.size; // 1 head ต่อมหาลัย
  const rectorCount = uniCount; // 1 rector ต่อมหาลัย (ตาม seedAccounts ใหม่)
  const consultantCount = consultants.consultants.length;
  const studentCount = students.length;

  console.log(`🏫 Universities: ${uniCount}`);
  console.log(`👑 Head Consultants: ${headCount} (head_{university_code})`);
  console.log(`🏛️ Rectors: ${rectorCount} (rector_{university_code})`);
  console.log(`🏛️ Ministry: 1 (ministry_admin)`);
  console.log(`🛡️ Super Admin: 1 (superAdmin)`);
  console.log(`👨‍🏫 Advisors: ${advisors.length} (advisor_{uni}_{dept})`);
  console.log(`👔 Deans: ${deans.length} (dean_{uni}_{faculty})`);
  console.log(`💼 Consultants: ${consultantCount} (consultant_{university_code}_1..5)`);
  const studentCountLog = isDevMode 
    ? `${geo.universities.length * 30} (Dev Mode: 30/uni)` 
    : `~1.8M (Full Scale)`;

  console.log(`🎓 Students: ${studentCountLog}`);

  // =========================
  // Credentials (รองรับทุกมหาลัย)
  // =========================
  console.log("\n🔑 Login Credentials:");
  console.log("   Ministry: ministry_admin");
  console.log("   Head: head_{university_code}");
  console.log("   Rector: rector_{university_code}");
  console.log("   Super: superAdmin");
  console.log("   Advisor: advisor_{uni}_{dept} (e.g. advisor_cu_cse)");
  console.log("   Dean: dean_{uni}_{faculty} (e.g. dean_cu_eng)");
  console.log("   Consultant: consultant_{university_code}_1 .. _5");
  console.log("   Student (new): stu_{university_code}_01 .. _30");
  console.log("   Student (old): student1 - student120  (ถ้ายังใช้ seedStudents เวอร์ชันเก่า)");
  console.log(`   Password: ${st.plainPassword}`);
  console.log("\\n💡 Note: Bookings created for ALL students\\n");

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
