import { PrismaClient, RegionCode } from "@prisma/client";
import { provincesData } from "../seed-data/provinces";
import { universitiesData } from "../seed-data/universities";

export async function seedGeo(prisma: PrismaClient) {
  console.log("📍 Creating regions and provinces...");

  // =========================
  // Regions (rerun-safe)
  // =========================
  const regionsMap = new Map<RegionCode, number>();

  for (const r of [
    { code: RegionCode.NORTH, th: "ภาคเหนือ", en: "North" },
    { code: RegionCode.CENTRAL, th: "ภาคกลาง", en: "Central" },
    { code: RegionCode.NORTHEAST, th: "ภาคตะวันออกเฉียงเหนือ", en: "Northeast" },
    { code: RegionCode.EAST, th: "ภาคตะวันออก", en: "East" },
    { code: RegionCode.SOUTH, th: "ภาคใต้", en: "South" },
  ]) {
    const region = await prisma.region.upsert({
      where: { region_code: r.code },
      create: { region_code: r.code, region_name_th: r.th, region_name_en: r.en },
      update: { region_name_th: r.th, region_name_en: r.en },
    });

    regionsMap.set(r.code, region.region_id);
  }

  // =========================
  // Provinces (rerun-safe)
  // =========================
  await prisma.province.createMany({
    data: provincesData.map((p) => ({
      province_code: p.code,
      province_name_th: p.th,
      province_name_en: p.en,
      region_id: regionsMap.get(p.region)!,
    })),
    skipDuplicates: true,
  });

  // ทำ map ไว้หา province_id ง่าย ๆ
  const provinces = await prisma.province.findMany({
    orderBy: { province_name_th: "asc" },
  });

  const provinceIdByCode = new Map<string, number>();
  for (const p of provinces) provinceIdByCode.set(p.province_code, p.province_id);

  // =========================
  // Universities (rerun-safe)
  // =========================
  console.log("🏫 Creating universities...");

  for (const u of universitiesData) {
    const provinceId = provinceIdByCode.get(u.province_code);
    if (!provinceId) {
      throw new Error(
        `Province not found for university ${u.code}: province_code=${u.province_code}`,
      );
    }

    await prisma.university.upsert({
      where: { university_code: u.code },
      create: {
        university_code: u.code,
        university_name_th: u.th,
        university_name_en: u.en,
        province_id: provinceId,
        university_is_active: u.is_active,
      },
      update: {
        university_name_th: u.th,
        university_name_en: u.en,
        province_id: provinceId,
        university_is_active: u.is_active,
      },
    });
  }

  const universities = await prisma.university.findMany({
    where: { university_code: { in: universitiesData.map((x) => x.code) } },
    orderBy: { university_code: "asc" },
  });

  return {
    regions: Array.from(regionsMap.entries()),
    provinces,
    universities,
  };
}
