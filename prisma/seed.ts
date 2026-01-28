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

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seeding...\n");

  await clearDatabase(prisma);

  const geo = await seedGeo(prisma); // regions, provinces, universities
  const st = await seedStatic(prisma); // status, org, categories, criteria, templates, pointRule, passwordHash

  const acad = await seedFacultiesDepartments(prisma, {
    universities: geo.universities,
  });

  const advisors = await seedAdvisors(prisma, {
    universities: geo.universities,
    facultyByUniAndCode: acad.facultyByUniAndCode,
    deptByUniAndCode: acad.deptByUniAndCode,
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
    { status: BookingStatus.COMPLETED, count: 1200 },
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

  // =========================
  // Summary (เหมือนเดิม)
  // =========================
  const [uniNU, uniKKU, uniCU] = geo.universities;

  console.log("\n✅ Database seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏫 Universities: ${geo.universities.length} (NU, KKU, CU)`);
  console.log(`👑 Head Consultants: 3 (head_nu, head_kku, head_cu)`);
  console.log(`🏛️ Rectors: 3 (rector_nu, rector_kku, rector_cu)`);
  console.log(`🛡️ Super Admin: 1 (superAdmin)`);
  console.log(`🎓 Students: ${students.length}`);

  const cntNU = students.filter((s) => s.university_id === uniNU.university_id).length;
  const cntKKU = students.filter((s) => s.university_id === uniKKU.university_id).length;
  const cntCU = students.filter((s) => s.university_id === uniCU.university_id).length;

  console.log(`🎓 Students: ${students.length} (NU=${cntNU}, KKU=${cntKKU}, CU=${cntCU})`);
  console.log(`⏰ Time Slots: ${timeSlots.totalTimeSlots}`);
  console.log(`📅 Bookings: ${bookingPlan.reduce((sum, p) => sum + p.count, 0)}`);
  console.log(`   - Completed: ${bookingPlan.find((p) => p.status === BookingStatus.COMPLETED)?.count || 0}`);
  console.log(`   - In Progress: ${bookingPlan.find((p) => p.status === BookingStatus.IN_PROGRESS)?.count || 0}`);
  console.log(`   - Pending: ${bookingPlan.find((p) => p.status === BookingStatus.PENDING_ASSIGNMENT)?.count || 0}`);
  console.log(`   - Cancelled: ${bookingPlan.find((p) => p.status === BookingStatus.CANCELLED)?.count || 0}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n🔑 Login Credentials:");
  console.log("   Head: head_nu / head_kku / head_cu");
  console.log("   Rector: rector_nu / rector_kku / rector_cu");
  console.log("   Super: superAdmin");
  console.log("   Consultant: consultant_{nu|kku|cu}_1 .. _5");
  console.log("   Student: student1 - student20");
  console.log(`   Password: ${st.plainPassword}`);
  console.log("\n💡 Note: Bookings created for ALL students\n");

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
