
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying Seed Data...");

  // 1. Count Universities
  const uniCount = await prisma.university.count();
  console.log(`🏫 Universities: ${uniCount}`);

  // 2. Count Faculties
  const facCount = await prisma.faculty.count();
  console.log(`🏛️  Faculties: ${facCount} (Expected ~${uniCount * 19})`);

  // 3. Count Departments
  const deptCount = await prisma.department.count();
  console.log(`📚 Departments: ${deptCount} (Expected ~${uniCount * 105})`);

  // 4. Count Deans
  const deanCount = await prisma.account.count({
    where: { account_role: "DEAN" },
  });
  console.log(`👔 Deans: ${deanCount} (Expected ~${facCount})`);

  // 5. Check specific University (CU)
  const cu = await prisma.university.findFirst({
    where: { university_code: "CU" },
    include: {
      faculties: {
        include: {
          departments: true,
          dean: true,
        },
      },
    },
  });

  if (cu) {
    console.log(`\n🔎 Checking Chulalongkorn University (CU):`);
    console.log(`   - Faculties: ${cu.faculties.length}`);
    const totalDepts = cu.faculties.reduce((acc, f) => acc + f.departments.length, 0);
    console.log(`   - Total Departments: ${totalDepts}`);
    
    const engFaculty = cu.faculties.find(f => f.faculty_code === "ENG");
    if (engFaculty) {
      console.log(`   - Engineering Faculty found!`);
      console.log(`     - Dean: ${engFaculty.dean?.account_username} (Role: ${engFaculty.dean?.account_role})`);
      console.log(`     - Departments: ${engFaculty.departments.length}`);
      console.log(`     - Dean Account ID: ${engFaculty.dean_account_id}`);
    } else {
      console.error(`   ❌ Engineering Faculty NOT found!`);
    }
  } else {
    console.error(`❌ CU University NOT found!`);
  }

  // 6. Check Dean Account Role matches
  const deanCheck = await prisma.account.findFirst({
    where: { account_username: "dean_cu_eng" },
    include: { facultiesDean: true }
  });

  if (deanCheck) {
    console.log(`\n👤 Checking Dean Account (dean_cu_eng):`);
    console.log(`   - Role: ${deanCheck.account_role}`);
    console.log(`   - Managed Faculties: ${deanCheck.facultiesDean.length}`);
    if (deanCheck.facultiesDean.length > 0) {
      console.log(`   - Managed Faculty Code: ${deanCheck.facultiesDean[0].faculty_code}`);
    }
  } else {
    console.error(`❌ dean_cu_eng Account NOT found!`);
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
