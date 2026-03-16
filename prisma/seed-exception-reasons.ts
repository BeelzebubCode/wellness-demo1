import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const data = [
    { exception_reason_code: "EMERGENCY", exception_reason_name_th: "เหตุฉุกเฉิน/อุบัติเหตุ", exception_reason_name_en: "Emergency/Accident", exception_reason_is_active: true, exception_reason_sort_order: 1 },
    { exception_reason_code: "SICK", exception_reason_name_th: "เจ็บป่วยกะทันหัน", exception_reason_name_en: "Sudden illness", exception_reason_is_active: true, exception_reason_sort_order: 2 },
    { exception_reason_code: "FAMILY", exception_reason_name_th: "ปัญหาครอบครัวเร่งด่วน", exception_reason_name_en: "Urgent family issue", exception_reason_is_active: true, exception_reason_sort_order: 3 },
    { exception_reason_code: "EXAM_CONFLICT", exception_reason_name_th: "ติดสอบ/กิจกรรมบังคับ", exception_reason_name_en: "Exam/mandatory activity conflict", exception_reason_is_active: true, exception_reason_sort_order: 4 },
    { exception_reason_code: "TRANSPORT", exception_reason_name_th: "ปัญหาการเดินทาง", exception_reason_name_en: "Transportation issue", exception_reason_is_active: true, exception_reason_sort_order: 5 },
    { exception_reason_code: "OTHER", exception_reason_name_th: "อื่นๆ", exception_reason_name_en: "Other", exception_reason_is_active: true, exception_reason_sort_order: 99 },
  ];

  for (const d of data) {
    await prisma.exceptionReason.upsert({
      where: { exception_reason_code: d.exception_reason_code },
      update: d,
      create: d,
    });
  }

  const count = await prisma.exceptionReason.count();
  console.log("✅ Exception reasons seeded:", count);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
