// prisma/seeds/00-reference-tables.ts
// Seed all lookup/category reference tables (must run BEFORE student/address seeds)

import { PrismaClient } from "@prisma/client";

export async function seedReferenceTables(prisma: PrismaClient) {
  console.log("🌱 Seeding reference tables...");

  // Helper: upsert an array of { code, name_th, name_en, sort_order } into a model
  async function upsertAll(model: any, data: { code: string; name_th: string; name_en?: string; sort_order: number }[]) {
    for (const item of data) {
      await model.upsert({
        where: { code: item.code },
        update: item,
        create: item,
      });
    }
  }

  await upsertAll(prisma.genderCategory, [
    { code: "MALE", name_th: "ชาย", name_en: "Male", sort_order: 1 },
    { code: "FEMALE", name_th: "หญิง", name_en: "Female", sort_order: 2 },
    { code: "LGBTQ_PLUS", name_th: "LGBTQ+", name_en: "LGBTQ+", sort_order: 3 },
  ]);
  console.log("   ✅ GenderCategory");

  await upsertAll(prisma.bloodGroupCategory, [
    { code: "A", name_th: "กรุ๊ป A", name_en: "Type A", sort_order: 1 },
    { code: "B", name_th: "กรุ๊ป B", name_en: "Type B", sort_order: 2 },
    { code: "AB", name_th: "กรุ๊ป AB", name_en: "Type AB", sort_order: 3 },
    { code: "O", name_th: "กรุ๊ป O", name_en: "Type O", sort_order: 4 },
  ]);
  console.log("   ✅ BloodGroupCategory");

  await upsertAll(prisma.incomeBracketCategory, [
    { code: "UNDER_100K", name_th: "ต่ำกว่า 100,000 บาท/ปี", name_en: "Under 100,000 THB/year", sort_order: 1 },
    { code: "BETWEEN_100K_200K", name_th: "100,000–199,999 บาท/ปี", name_en: "100,000–199,999 THB/year", sort_order: 2 },
    { code: "BETWEEN_200K_300K", name_th: "200,000–299,999 บาท/ปี", name_en: "200,000–299,999 THB/year", sort_order: 3 },
    { code: "BETWEEN_300K_500K", name_th: "300,000–499,999 บาท/ปี", name_en: "300,000–499,999 THB/year", sort_order: 4 },
    { code: "BETWEEN_500K_800K", name_th: "500,000–799,999 บาท/ปี", name_en: "500,000–799,999 THB/year", sort_order: 5 },
    { code: "BETWEEN_800K_1M", name_th: "800,000–999,999 บาท/ปี", name_en: "800,000–999,999 THB/year", sort_order: 6 },
    { code: "OVER_1M", name_th: "1,000,000 บาทขึ้นไป/ปี", name_en: "Over 1,000,000 THB/year", sort_order: 7 },
  ]);
  console.log("   ✅ IncomeBracketCategory");

  await upsertAll(prisma.parentalStatusCategory, [
    { code: "TOGETHER", name_th: "พ่อแม่อยู่ด้วยกัน", name_en: "Parents together", sort_order: 1 },
    { code: "DIVORCED", name_th: "หย่าร้าง", name_en: "Divorced", sort_order: 2 },
    { code: "FATHER_DECEASED", name_th: "บิดาเสียชีวิต", name_en: "Father deceased", sort_order: 3 },
    { code: "MOTHER_DECEASED", name_th: "มารดาเสียชีวิต", name_en: "Mother deceased", sort_order: 4 },
    { code: "BOTH_DECEASED", name_th: "เสียชีวิตทั้งคู่", name_en: "Both parents deceased", sort_order: 5 },
    { code: "SINGLE_PARENT", name_th: "เลี้ยงเดี่ยว (อื่นๆ)", name_en: "Single parent (other)", sort_order: 6 },
  ]);
  console.log("   ✅ ParentalStatusCategory");

  await upsertAll(prisma.educationLevelCategory, [
    { code: "BACHELOR", name_th: "ปริญญาตรี", name_en: "Bachelor's Degree", sort_order: 1 },
    { code: "MASTER", name_th: "ปริญญาโท", name_en: "Master's Degree", sort_order: 2 },
    { code: "DOCTORATE", name_th: "ปริญญาเอก", name_en: "Doctoral Degree", sort_order: 3 },
  ]);
  console.log("   ✅ EducationLevelCategory");

  await upsertAll(prisma.addressTypeCategory, [
    { code: "PERMANENT", name_th: "ที่อยู่ตามทะเบียนบ้าน", name_en: "Permanent address", sort_order: 1 },
    { code: "CURRENT", name_th: "ที่อยู่ปัจจุบัน", name_en: "Current address", sort_order: 2 },
    { code: "DORMITORY", name_th: "หอพัก", name_en: "Dormitory", sort_order: 3 },
  ]);
  console.log("   ✅ AddressTypeCategory");

  await upsertAll(prisma.nationalityTypeCategory, [
    { code: "THAI", name_th: "คนไทย", name_en: "Thai", sort_order: 1 },
    { code: "INTERNATIONAL", name_th: "ชาวต่างชาติ", name_en: "International", sort_order: 2 },
  ]);
  console.log("   ✅ NationalityTypeCategory");

  await upsertAll(prisma.academicPeriodTypeCategory, [
    { code: "MIDTERM_EXAM", name_th: "สอบกลางภาค", name_en: "Midterm Exam", sort_order: 1 },
    { code: "FINAL_EXAM", name_th: "สอบปลายภาค", name_en: "Final Exam", sort_order: 2 },
    { code: "SEMESTER_BREAK", name_th: "ปิดเทอม", name_en: "Semester Break", sort_order: 3 },
  ]);
  console.log("   ✅ AcademicPeriodTypeCategory");

  await upsertAll(prisma.serviceModeCategory, [
    { code: "ONSITE", name_th: "พบหน้า (Onsite)", name_en: "Onsite", sort_order: 1 },
    { code: "ONLINE", name_th: "ออนไลน์", name_en: "Online", sort_order: 2 },
  ]);
  console.log("   ✅ ServiceModeCategory");

  await upsertAll(prisma.universityTypeCategory, [
    { code: "SUPERVISED", name_th: "มหาวิทยาลัยในกำกับ", name_en: "Supervised University", sort_order: 1 },
    { code: "PUBLIC", name_th: "มหาวิทยาลัยรัฐ", name_en: "Public University", sort_order: 2 },
    { code: "PRIVATE", name_th: "มหาวิทยาลัยเอกชน", name_en: "Private University", sort_order: 3 },
  ]);
  console.log("   ✅ UniversityTypeCategory");

  console.log("🌱 All reference tables seeded!\n");
}
