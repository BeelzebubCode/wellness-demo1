// prisma/seeds/10-university-types.ts
/**
 * Seed university types based on MHESI classification:
 * - SUPERVISED: มหาวิทยาลัยในกำกับ (26 แห่ง)
 * - PUBLIC: มหาวิทยาลัยรัฐ (57 แห่ง) - รวมราชภัฏและราชมงคล
 * - PRIVATE: มหาวิทยาลัยเอกชน (72 แห่ง)
 */

import { PrismaClient, UniversityType } from "@prisma/client";

// SUPERVISED Universities (26 institutions)
const SUPERVISED_UNIVERSITIES = [
  "CU",     // จุฬาลงกรณ์มหาวิทยาลัย
  "KU",     // มหาวิทยาลัยเกษตรศาสตร์
  "KKU",    // มหาวิทยาลัยขอนแก่น
  "CMU",    // มหาวิทยาลัยเชียงใหม่
  "TSU",    // มหาวิทยาลัยทักษิณ
  "KMUTT",  // มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี
  "KMUTNB", // มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
  "SUT",    // มหาวิทยาลัยเทคโนโลยีสุรนารี
  "TU",     // มหาวิทยาลัยธรรมศาสตร์
  "BUU",    // มหาวิทยาลัยบูรพา
  "UP",     // มหาวิทยาลัยพะเยา
  "MCU",    // มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
  "MBU",    // มหาวิทยาลัยมหามกุฏราชวิทยาลัย
  "MU",     // มหาวิทยาลัยมหิดล
  "MFU",    // มหาวิทยาลัยแม่ฟ้าหลวง
  "WU",     // มหาวิทยาลัยวลัยลักษณ์
  "SWU",    // มหาวิทยาลัยศรีนครินทรวิโรฒ
  "SU",     // มหาวิทยาลัยศิลปากร
  "DRU",    // มหาวิทยาลัยสวนดุสิต
  "PSU",    // มหาวิทยาลัยสงขลานครินทร์
  "MJU",    // มหาวิทยาลัยแม่โจ้
  "PGVIM",  // สถาบันดนตรีกัลยาณิวัฒนา
  "KMITL",  // สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
  "STIN",   // สถาบันการพยาบาลศรีสวรินทรา สภากาชาดไทย
  "CDI",    // สถาบันเทคโนโลยีจิตรลดา
  "NIDA",   // สถาบันบัณฑิตพัฒนบริหารศาสตร์
];

// Map university codes to their types
const universityTypeMap: Record<string, UniversityType> = {};

// Initialize SUPERVISED universities
SUPERVISED_UNIVERSITIES.forEach(code => {
  universityTypeMap[code] = "SUPERVISED";
});

// Classification function
function classifyUniversityByName(name: string, code: string): UniversityType {
  const nameLower = name.toLowerCase();
  
  // Check code map first
  if (universityTypeMap[code]) {
    return universityTypeMap[code];
  }
  
  // PRIVATE universities patterns
  if (
    nameLower.includes("เอกชน") ||
    code.includes("AU") ||
    code.includes("ABAC") ||
    code.includes("DPU") ||
    code.includes("BU") ||
    code.includes("RSU") ||
    code.includes("SPU") ||
    nameLower.includes("กรุงเทพ") && !code.includes("KMUTT") ||
    nameLower.includes("assumption") ||
    nameLower.includes("หอการค้า") ||
    nameLower.includes("ธุรกิจบัณฑิต") ||
    nameLower.includes("รังสิต") ||
    nameLower.includes("ศรีปทุม") ||
    nameLower.includes("สยาม") ||
    nameLower.includes("webster") ||
    nameLower.includes("stamford") ||
    nameLower.includes("huachiew")
  ) {
    return "PRIVATE";
  }
  
  // All others are PUBLIC (including Rajabhat & Rajamangala)
  // PUBLIC หมายถึง: มหาวิทยาลัยรัฐทั่วไป + ราชภัฏ + ราชมงคล
  return "PUBLIC";
}

export async function seedUniversityTypes(prisma: PrismaClient) {
  console.log("🏛️  Assigning university types...");
  
  const universities = await prisma.university.findMany({
    select: {
      university_id: true,
      university_code: true,
      university_name_th: true,
      university_name_en: true,
    },
  });

  let supervisedCount = 0;
  let publicCount = 0;
  let privateCount = 0;

  for (const uni of universities) {
    const type = classifyUniversityByName(
      uni.university_name_th || uni.university_name_en || "",
      uni.university_code
    );

    await prisma.university.update({
      where: { university_id: uni.university_id },
      data: { university_type: type },
    });

    if (type === "SUPERVISED") supervisedCount++;
    else if (type === "PUBLIC") publicCount++;
    else if (type === "PRIVATE") privateCount++;

    console.log(`  ✓ ${uni.university_code.padEnd(12)} → ${type}`);
  }

  console.log(`\n  📊 Summary:`);
  console.log(`     SUPERVISED: ${supervisedCount} universities`);
  console.log(`     PUBLIC:     ${publicCount} universities`);
  console.log(`     PRIVATE:    ${privateCount} universities`);
  console.log(`     TOTAL:      ${universities.length} universities`);
}
