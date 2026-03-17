
import { universitiesData } from "../prisma/seed-data/universities";

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

const universityTypeMap: Record<string, string> = {};
SUPERVISED_UNIVERSITIES.forEach(code => universityTypeMap[code] = "SUPERVISED");
PUBLIC_UNIVERSITIES.forEach(code => universityTypeMap[code] = "PUBLIC");
PRIVATE_UNIVERSITIES.forEach(code => universityTypeMap[code] = "PRIVATE");

function classifyUniversityByName(name: string, code: string): string {
  // Direct match by code
  if (universityTypeMap[code]) {
    return universityTypeMap[code];
  }
  
  // Fallback
  const nameLower = name.toLowerCase();
  if (
    nameLower.includes("college") || 
    nameLower.includes("international") || 
    nameLower.includes("วิทยาลัย")
  ) {
    if (!nameLower.includes("ชุมชน")) return "PRIVATE";
  }

  return "PUBLIC";
}

// Map intended types based on universities.ts structure (User comments)
// Group 1: Supervised
// Group 2: Public
// Group 3: Private

// Since universities.ts is a flat array in the export, we have to infer the groups from the file content or order.
// However, checking the file content again, the groups are commented.
// Let's just output the classification and manually review if any "Private" sounding ones are "PUBLIC" or vice versa.

const results = universitiesData.map(u => {
  const type = classifyUniversityByName(u.th || u.en || "", u.code);
  return { code: u.code, name: u.th, type };
});


const supervised = results.filter(r => r.type === "SUPERVISED");
const privateUni = results.filter(r => r.type === "PRIVATE");
const publicUni = results.filter(r => r.type === "PUBLIC");

console.log(`\n📊 SUMMARY:`);
console.log(`SUPERVISED: ${supervised.length}`);
console.log(`PRIVATE:    ${privateUni.length}`);
console.log(`PUBLIC:     ${publicUni.length}`);
console.log(`TOTAL:      ${results.length}`);

console.log("\n--- SUPERVISED LIST ---");
console.log(supervised.map(u => `${u.code} ${u.name}`).join("\n"));

console.log("\n--- PRIVATE LIST ---");
console.log(privateUni.map(u => `${u.code} ${u.name}`).join("\n"));

console.log("\n--- PUBLIC LIST (Check for misclassified Private UNIs) ---");
console.log(publicUni.map(u => `${u.code} ${u.name}`).join("\n"));

