// prisma/seed-nu-test-student.ts
// สร้าง 1 นิสิต NU สำหรับทดสอบ
// รัน: npx tsx prisma/seed-nu-test-student.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const PLAIN_PASSWORD = "wellness@nu.ac.th_123456!";
  const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, 10);

  // 1. หา university NU
  const nu = await prisma.university.findUnique({
    where: { university_code: "NU" },
  });
  if (!nu) {
    const allUnis = await prisma.university.findMany({
      select: { university_code: true, university_name_th: true },
      orderBy: { university_code: "asc" },
    });
    if (allUnis.length === 0) {
      throw new Error("ไม่มีมหาวิทยาลัยในระบบเลย — ต้อง seed university ก่อน");
    }
    console.log("⚠️  ไม่พบ university_code = 'NU'");
    console.log("📋 มหาวิทยาลัยที่มีในระบบ:");
    allUnis.forEach((u) => console.log(`   ${u.university_code.padEnd(12)} ${u.university_name_th}`));
    throw new Error("กรุณาแก้ university_code ใน script ให้ตรงกับที่มีในระบบ");
  }

  // 2. หา student_status ACTIVE
  const statusActive = await prisma.studentStatus.findFirst({
    where: { student_status_code: "ACTIVE" },
  });
  if (!statusActive) throw new Error("ไม่พบ student_status ACTIVE");

  // 3. หา gender MALE
  const genderMale = await prisma.genderCategory.findFirst({
    where: { code: "MALE" },
  });

  // 4. สร้าง Account
  const account = await prisma.account.upsert({
    where: { account_username: "stu_nu_test_0001" },
    create: {
      account_username: "stu_nu_test_0001",
      account_password: passwordHash,
      account_role_id: 1, // STUDENT
      account_home_university_id: nu.university_id,
    },
    update: {
      account_password: passwordHash,
    },
  });
  console.log(`✅ Account created: id=${account.account_id}, username=${account.account_username}`);

  // 5. สร้าง Student
  const student = await prisma.student.upsert({
    where: { account_id: account.account_id },
    create: {
      account_id: account.account_id,
      university_id: nu.university_id,
      student_status_id: statusActive.student_status_id,
      student_code: "68010001",
    },
    update: {},
  });
  console.log(`✅ Student created: id=${student.student_id}, code=${student.student_code}`);

  // 6. สร้าง Profile
  await prisma.studentProfile.upsert({
    where: {
      university_id_student_id: {
        university_id: nu.university_id,
        student_id: student.student_id,
      },
    },
    create: {
      student_id: student.student_id,
      university_id: nu.university_id,
      student_prefix: "นาย",
      student_first_name_th: "สมชาย",
      student_last_name_th: "ใจดี",
      student_first_name_en: "Somchai",
      student_last_name_en: "Jaidee",
      student_nickname_th: "ชาย",
      student_phone_number: "0812345678",
      student_email: "stu_nu_test_0001@nu.ac.th",
      student_birthday: new Date("2003-05-15"),
      gender_category_id: genderMale?.gender_category_id ?? null,
    },
    update: {},
  });
  console.log(`✅ Profile created`);

  console.log(`\n🎉 เสร็จสิ้น! ข้อมูล login:`);
  console.log(`   Username: stu_nu_test_0001`);
  console.log(`   Password: ${PLAIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
