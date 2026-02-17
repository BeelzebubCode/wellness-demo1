// prisma/seeds/17-cancellation-reasons.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedCancellationReasons() {
  console.log("🔄 Seeding Cancellation Reasons...");

  const reasons = [
    {
      code: "RESCHEDULE",
      nameTh: "เปลี่ยนวัน/เวลาไม่สะดวก",
      nameEn: "Schedule Change",
      description: "ต้องการเปลี่ยนแปลงวันหรือเวลานัดหมาย",
    },
    {
      code: "FEELING_BETTER",
      nameTh: "อาการดีขึ้น",
      nameEn: "Feeling Better",
      description: "อาการดีขึ้นและไม่จำเป็นต้องรับคำปรึกษาแล้ว",
    },
    {
      code: "EMERGENCY",
      nameTh: "มีเหตุฉุกเฉิน",
      nameEn: "Emergency",
      description: "เกิดเหตุฉุกเฉินที่ไม่สามารถมาตามนัดได้",
    },
    {
      code: "WRONG_BOOKING",
      nameTh: "จองผิด",
      nameEn: "Wrong Booking",
      description: "จองนัดหมายผิดพลาด",
    },
    {
      code: "LOCATION_ISSUE",
      nameTh: "ไม่สะดวกเรื่องสถานที่/การเดินทาง",
      nameEn: "Location/Travel Issue",
      description: "ไม่สะดวกในการเดินทางมาตามสถานที่นัดหมาย",
    },
    {
      code: "OTHER",
      nameTh: "อื่น ๆ",
      nameEn: "Other",
      description: "เหตุผลอื่นๆ ที่ไม่อยู่ในหมวดหมู่ที่กำหนด",
    },
  ];

  for (const reason of reasons) {
    await prisma.cancellationReason.upsert({
      where: { cancellation_reason_code: reason.code },
      update: {
        cancellation_reason_name_th: reason.nameTh,
        cancellation_reason_name_en: reason.nameEn,
        cancellation_reason_description: reason.description,
      },
      create: {
        cancellation_reason_code: reason.code,
        cancellation_reason_name_th: reason.nameTh,
        cancellation_reason_name_en: reason.nameEn,
        cancellation_reason_description: reason.description,
      },
    });
  }

  console.log("✅ Seeded 6 Cancellation Reasons");
}

// Can be run standalone
if (require.main === module) {
  seedCancellationReasons()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
