// prisma/seeds/01-geo.ts

import { PrismaClient, Prisma, RegionCode } from "@prisma/client";
import { provincesData } from "../seed-data/provinces";
import { universitiesData } from "../seed-data/universities";
import { universityGpsByCode } from "../seed-data/university-gps";

export async function seedGeo(prisma: PrismaClient) {
  console.log("📍 Creating regions and provinces...");

  // =========================
  // Regions (rerun-safe)
  // =========================
  const regionsMap = new Map<RegionCode, number>();

  for (const r of [
    { code: RegionCode.UPPER_NORTH, th: "ภาคเหนือตอนบน", en: "Upper North" },
    { code: RegionCode.LOWER_NORTH, th: "ภาคเหนือตอนล่าง", en: "Lower North" },
    { code: RegionCode.UPPER_NORTHEAST, th: "ภาคตะวันออกเฉียงเหนือตอนบน", en: "Upper Northeast" },
    { code: RegionCode.LOWER_NORTHEAST, th: "ภาคตะวันออกเฉียงเหนือตอนล่าง", en: "Lower Northeast" },
    { code: RegionCode.UPPER_CENTRAL, th: "ภาคกลางตอนบน", en: "Upper Central" },
    { code: RegionCode.LOWER_CENTRAL, th: "ภาคกลางตอนล่าง", en: "Lower Central" },
    { code: RegionCode.EAST, th: "ภาคตะวันออก", en: "East" },
    { code: RegionCode.UPPER_SOUTH, th: "ภาคใต้ตอนบน", en: "Upper South" },
    { code: RegionCode.LOWER_SOUTH, th: "ภาคใต้ตอนล่าง", en: "Lower South" },
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

  let gpsFilled = 0;
  let gpsMissing = 0;

  for (const u of universitiesData) {
    const provinceId = provinceIdByCode.get(u.province_code);
    if (!provinceId) {
      throw new Error(
        `Province not found for university ${u.code}: province_code=${u.province_code}`,
      );
    }

    const gps = (universityGpsByCode as any)[u.code];
    if (gps) gpsFilled++;
    else gpsMissing++;

    await prisma.university.upsert({
      where: { university_code: u.code },
      create: {
        university_code: u.code,
        university_name_th: u.th,
        university_name_en: u.en,
        province_id: provinceId,
        university_is_active: u.is_active,

        // ✅ เติม lat/lon (numeric/decimal)
        university_latitude: gps ? new Prisma.Decimal(gps.lat) : null,
        university_longitude: gps ? new Prisma.Decimal(gps.lon) : null,
      },
      update: {
        university_name_th: u.th,
        university_name_en: u.en,
        province_id: provinceId,
        university_is_active: u.is_active,

        // ✅ เติม lat/lon (update ด้วย เผื่อ rerun แล้วเคย null)
        university_latitude: gps ? new Prisma.Decimal(gps.lat) : null,
        university_longitude: gps ? new Prisma.Decimal(gps.lon) : null,
      },
    });
  }

  console.log(`📍 University GPS: filled=${gpsFilled}, missing=${gpsMissing}`);

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
