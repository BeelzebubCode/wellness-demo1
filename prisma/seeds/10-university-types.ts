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
  "CU", "KU", "KKU", "CMU", "TSU", "KMUTT", "KMUTNB", "SUT", "TU", "BUU",
  "UP", "MCU", "MBU", "MU", "MFU", "WU", "SWU", "SU", "SDU", "PSU", "MJU",
  "PGVIM", "KMITL", "SNC", "CDTI", "NIDA", // Corrected codes (SNC instead of STIN, CDTI instead of CDI)
];

// PUBLIC Universities (Rajabhat, Rajamangala, and others)
const PUBLIC_UNIVERSITIES = [
  "KSU", "NARU", "STOU", "PTIT", "IICC",
  // Rajabhat
  "KRU", "KPRU", "CRU", "CPRU", "CRRU", "CMRU", "TSRU", "DRU", "NPRU", "NRRU",
  "NSTRU", "NSRU", "BSRU", "BRU", "PNRU", "PRU", "PSRU", "PBRU", "PBRU-PH",
  "PKRU", "MSRU", "YRU", "RERU", "RRU", "RBRU", "LPRU", "LPRU-LY", "VRU",
  "SSRU", "SNKRU", "SKRU", "SSRU-SUAN", "SRU", "SRRU", "MCRU", "UDRU", "URU", "UBRU",
  // Rajamangala
  "RMUTK", "RMUTTO", "RMUTT", "RMUTP", "RMUTR", "RMUTL", "RMUTSV", "RMUTSB", "RMUTI",
  // Other Public
  "RU", "NU", "MSU", "UBU", "NPU", 
];

// PRIVATE Universities
const PRIVATE_UNIVERSITIES = [
  "BUI", "BUS", "EUMT", "KRIRK", "KBU", "CUT", "CPU", "CUK", "SIU", "SJU",
  "TAPU", "MUT", "TBAC", "DPU", "NBU", "NCU", "STIU", "AIU", "NATIONU", "PTU",
  "PYU", "PLU", "FTU", "FEU", "CUI", "NEU", "RBU", "RTU", "RPU", "WUVC", "WUT",
  "WUWEST", "SIAMU", "HCU", "HATYAIU", "EAU", "SAU", "KANTANA", "PIM", "PULINET",
  "TNI", "MATI", "IST", "IESA", "RBAC", "VISTEC", "ARSOM", "CKRY", "CRC", "SLC",
  "SEBU", "DTC", "TSK", "PWT", "STC", "SIT", "NMC", "RIC", "STIC", "BAC", "PBC",
  "IBSC", "NC", "SANTAPOL", "SDC", "INTERTECH",
  // Additional Private
  "BU", "SPU", "UTCC", "RSU", "ABAC",
];

// Map university codes to their types
const universityTypeMap: Record<string, UniversityType> = {};

// Initialize mapping
SUPERVISED_UNIVERSITIES.forEach(code => universityTypeMap[code] = "SUPERVISED");
PUBLIC_UNIVERSITIES.forEach(code => universityTypeMap[code] = "PUBLIC");
PRIVATE_UNIVERSITIES.forEach(code => universityTypeMap[code] = "PRIVATE");

// Classification function
function classifyUniversityByName(name: string, code: string): UniversityType {
  // Direct match by code
  if (universityTypeMap[code]) {
    return universityTypeMap[code];
  }
  
  // Fallback for any missing ones (SAFE DEFAULT)
  // Check common Private keywords just in case
  const nameLower = name.toLowerCase();
  if (
    nameLower.includes("college") || 
    nameLower.includes("international") || 
    nameLower.includes("วิทยาลัย") // Generic college match
  ) {
    // Check if it's NOT a known public college (like Community Colleges IICC)
    if (!nameLower.includes("ชุมชน")) return "PRIVATE";
  }

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
