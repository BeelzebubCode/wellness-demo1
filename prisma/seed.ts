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

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seeding...\\n");

  await clearDatabase(prisma);

  const geo = await seedGeo(prisma); // regions, provinces, universities
  const st = await seedStatic(prisma); // status, org, categories, criteria, templates, pointRule, passwordHash, plainPassword

  const acad = await seedFacultiesDepartments(prisma, {
    universities: geo.universities,
  });

  const advisors = await seedAdvisors(prisma, {
    universities: geo.universities,
    facultyByUniAndCode: acad.facultyByUniAndCode,
    deptByUniAndCode: acad.deptByUniAndCode,
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

  const timeSlots = await seedTimeSlots(prisma, { universities: geo.universities });

  const bookingPlan: { status: BookingStatus; count: number }[] = [
    { status: BookingStatus.COMPLETED, count: 100 },
    { status: BookingStatus.IN_PROGRESS, count: 0 },
    { status: BookingStatus.PENDING_ASSIGNMENT, count: 0 },
    { status: BookingStatus.CANCELLED, count: 100 },
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
    pointRule: st.pointRule,
    pointAmount: st.pointAmount,
    consultantBiasById: consultants.consultantBiasById,
    bookingPlan,
  });

  console.log("\\n🏛️  Seeding university types...");
  await seedUniversityTypes(prisma);

  console.log("\\n🌐 Seeding university connections...");
  await seedUniversityConnections(prisma);

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
  console.log(`💼 Consultants: ${consultantCount} (consultant_{university_code}_1..5)`);
  console.log(`🎓 Students: ${studentCount}`);

  // ...\n\n  // =========================
  // Credentials (รองรับทุกมหาลัย)
  // =========================
  console.log("\\n🔑 Login Credentials:");
  console.log("   Ministry: ministry_admin");
  console.log("   Head: head_{university_code}");
  console.log("   Rector: rector_{university_code}");
  console.log("   Super: superAdmin");
  console.log("   Advisor: advisor_{uni}_{dept} (e.g. advisor_cu_cse)");
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
