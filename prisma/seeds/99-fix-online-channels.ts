import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️  Seeding Online Channel Categories...");

  const onlineChannelsData = [
    { code: "LINE_CALL", name_th: "LINE Call", name_en: "LINE Call" },
    { code: "GOOGLE_MEET", name_th: "Google Meet", name_en: "Google Meet" },
    { code: "ZOOM", name_th: "Zoom", name_en: "Zoom" },
    { code: "MICROSOFT_TEAMS", name_th: "Microsoft Teams", name_en: "Microsoft Teams" },
    { code: "PHONE", name_th: "โทรศัพท์", name_en: "Phone" },
  ];

  for (const c of onlineChannelsData) {
    await prisma.onlineChannelCategory.upsert({
      where: { online_channel_code: c.code },
      create: {
        online_channel_code: c.code,
        online_channel_name_th: c.name_th,
        online_channel_name_en: c.name_en,
        is_active: true,
      },
      update: {
        online_channel_name_th: c.name_th,
        online_channel_name_en: c.name_en,
        is_active: true,
      },
    });
  }

  console.log("✅  Online Channel Categories seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
