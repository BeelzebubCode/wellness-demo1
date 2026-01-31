// src/config/tenants.ts

export type TenantCode =
  | "DEFAULT"
  // CENTRAL / BANGKOK
  | "CU"
  | "TU"
  | "MU"
  | "KU"
  | "SU"
  | "SWU"
  | "RU"
  | "NIDA"
  | "KMUTT"
  | "KMITL"
  | "KMUTNB"
  // NORTH
  | "CMU"
  | "MFU"
  | "MJU"
  | "UP"
  | "NU"
  // NORTHEAST
  | "KKU"
  | "MSU"
  | "SURO"
  | "UBU"
  | "NPU"
  | "KSU"
  // EAST
  | "BUU"
  // SOUTH
  | "PSU"
  | "WU"
  | "TSU"
  // RAJABHAT
  | "SRRU"
  | "BRU"
  | "CRRU"
  | "CMRU"
  | "KPRU"
  // PRIVATE
  | "BU"
  | "SPU"
  | "UTCC"
  | "RSU"
  | "ABAC";

export type TenantConfig = {
  code: TenantCode;
  nameTh: string;
  nameEn: string;
  brandName: string;
  logo?: string;
};

export const TENANTS: Record<TenantCode, TenantConfig> = {
  DEFAULT: {
    code: "DEFAULT",
    nameTh: "ระบบให้คำปรึกษา",
    nameEn: "Wellness System",
    brandName: "Wellness System",
    logo: "/images/Brand_wellness_center1.png",
  },

  // ===== CENTRAL / BANGKOK =====
  CU: {
    code: "CU",
    nameTh: "จุฬาลงกรณ์มหาวิทยาลัย",
    nameEn: "Chulalongkorn University",
    brandName: "CU Wellness",
    logo: "/images/logo/CU_logo.png",
  },
  TU: {
    code: "TU",
    nameTh: "มหาวิทยาลัยธรรมศาสตร์",
    nameEn: "Thammasat University",
    brandName: "TU Wellness",
    logo: "/images/logo/TU_logo.png",
  },
  MU: {
    code: "MU",
    nameTh: "มหาวิทยาลัยมหิดล",
    nameEn: "Mahidol University",
    brandName: "MU Wellness",
    logo: "/images/logo/MU_logo.png",
  },
  KU: {
    code: "KU",
    nameTh: "มหาวิทยาลัยเกษตรศาสตร์",
    nameEn: "Kasetsart University",
    brandName: "KU Wellness",
    logo: "/images/logo/KU_logo.png",
  },
  SU: {
    code: "SU",
    nameTh: "มหาวิทยาลัยศิลปากร",
    nameEn: "Silpakorn University",
    brandName: "SU Wellness",
    logo: "/images/logo/SU_logo.png",
  },
  SWU: {
    code: "SWU",
    nameTh: "มหาวิทยาลัยศรีนครินทรวิโรฒ",
    nameEn: "Srinakharinwirot University",
    brandName: "SWU Wellness",
    logo: "/images/logo/SWU_logo.png",
  },
  RU: {
    code: "RU",
    nameTh: "มหาวิทยาลัยรามคำแหง",
    nameEn: "Ramkhamhaeng University",
    brandName: "RU Wellness",
    logo: "/images/logo/RU_logo.png",
  },
  NIDA: {
    code: "NIDA",
    nameTh: "สถาบันบัณฑิตพัฒนบริหารศาสตร์",
    nameEn: "National Institute of Development Administration",
    brandName: "NIDA Wellness",
    logo: "/images/logo/NIDA_logo.png",
  },
  KMUTT: {
    code: "KMUTT",
    nameTh: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
    nameEn: "King Mongkut's University of Technology Thonburi",
    brandName: "KMUTT Wellness",
    logo: "/images/logo/KMUTT_logo.png",
  },
  KMITL: {
    code: "KMITL",
    nameTh: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
    nameEn: "King Mongkut's Institute of Technology Ladkrabang",
    brandName: "KMITL Wellness",
    logo: "/images/logo/KMITL_logo.png",
  },
  KMUTNB: {
    code: "KMUTNB",
    nameTh: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    nameEn: "King Mongkut's University of Technology North Bangkok",
    brandName: "KMUTNB Wellness",
    logo: "/images/logo/KMUTNB_logo.png",
  },

  // ===== NORTH =====
  CMU: {
    code: "CMU",
    nameTh: "มหาวิทยาลัยเชียงใหม่",
    nameEn: "Chiang Mai University",
    brandName: "CMU Wellness",
    logo: "/images/logo/CMU_logo.png",
  },
  MFU: {
    code: "MFU",
    nameTh: "มหาวิทยาลัยแม่ฟ้าหลวง",
    nameEn: "Mae Fah Luang University",
    brandName: "MFU Wellness",
    logo: "/images/logo/MFU_logo.png",
  },
  MJU: {
    code: "MJU",
    nameTh: "มหาวิทยาลัยแม่โจ้",
    nameEn: "Maejo University",
    brandName: "MJU Wellness",
    logo: "/images/logo/MJU_logo.png",
  },
  UP: {
    code: "UP",
    nameTh: "มหาวิทยาลัยพะเยา",
    nameEn: "University of Phayao",
    brandName: "UP Wellness",
    logo: "/images/logo/UP_logo.png",
  },
  NU: {
    code: "NU",
    nameTh: "มหาวิทยาลัยนเรศวร",
    nameEn: "Naresuan University",
    brandName: "NU Wellness",
    logo: "/images/logo/NU_logo.png",
  },

  // ===== NORTHEAST =====
  KKU: {
    code: "KKU",
    nameTh: "มหาวิทยาลัยขอนแก่น",
    nameEn: "Khon Kaen University",
    brandName: "KKU Wellness",
    logo: "/images/logo/KKU_logo.png",
  },
  MSU: {
    code: "MSU",
    nameTh: "มหาวิทยาลัยมหาสารคาม",
    nameEn: "Mahasarakham University",
    brandName: "MSU Wellness",
    logo: "/images/logo/MSU_logo.png",
  },
  SURO: {
    code: "SURO",
    nameTh: "มหาวิทยาลัยเทคโนโลยีสุรนารี",
    nameEn: "Suranaree University of Technology",
    brandName: "SURO Wellness",
    logo: "/images/logo/SURO_logo.png",
  },
  UBU: {
    code: "UBU",
    nameTh: "มหาวิทยาลัยอุบลราชธานี",
    nameEn: "Ubon Ratchathani University",
    brandName: "UBU Wellness",
    logo: "/images/logo/UBU_logo.png",
  },
  NPU: {
    code: "NPU",
    nameTh: "มหาวิทยาลัยนครพนม",
    nameEn: "Nakhon Phanom University",
    brandName: "NPU Wellness",
    logo: "/images/logo/NPU_logo.png",
  },
  KSU: {
    code: "KSU",
    nameTh: "มหาวิทยาลัยกาฬสินธุ์",
    nameEn: "Kalasin University",
    brandName: "KSU Wellness",
    logo: "/images/logo/KSU_logo.png",
  },

  // ===== EAST =====
  BUU: {
    code: "BUU",
    nameTh: "มหาวิทยาลัยบูรพา",
    nameEn: "Burapha University",
    brandName: "BUU Wellness",
    logo: "/images/logo/BUU_logo.png",
  },

  // ===== SOUTH =====
  PSU: {
    code: "PSU",
    nameTh: "มหาวิทยาลัยสงขลานครินทร์",
    nameEn: "Prince of Songkla University",
    brandName: "PSU Wellness",
    logo: "/images/logo/PSU_logo.png",
  },
  WU: {
    code: "WU",
    nameTh: "มหาวิทยาลัยวลัยลักษณ์",
    nameEn: "Walailak University",
    brandName: "WU Wellness",
    logo: "/images/logo/WU_logo.png",
  },
  TSU: {
    code: "TSU",
    nameTh: "มหาวิทยาลัยทักษิณ",
    nameEn: "Thaksin University",
    brandName: "TSU Wellness",
    logo: "/images/logo/TSU_logo.png",
  },

  // ===== RAJABHAT =====
  SRRU: {
    code: "SRRU",
    nameTh: "มหาวิทยาลัยราชภัฏสุรินทร์",
    nameEn: "Surindra Rajabhat University",
    brandName: "SRRU Wellness",
    logo: "/images/logo/SRRU_logo.png",
  },
  BRU: {
    code: "BRU",
    nameTh: "มหาวิทยาลัยราชภัฏบุรีรัมย์",
    nameEn: "Buriram Rajabhat University",
    brandName: "BRU Wellness",
    logo: "/images/logo/BRU_logo.png",
  },
  CRRU: {
    code: "CRRU",
    nameTh: "มหาวิทยาลัยราชภัฏเชียงราย",
    nameEn: "Chiang Rai Rajabhat University",
    brandName: "CRRU Wellness",
    logo: "/images/logo/CRRU_logo.png",
  },
  CMRU: {
    code: "CMRU",
    nameTh: "มหาวิทยาลัยราชภัฏเชียงใหม่",
    nameEn: "Chiang Mai Rajabhat University",
    brandName: "CMRU Wellness",
    logo: "/images/logo/CMRU_logo.png",
  },
  KPRU: {
    code: "KPRU",
    nameTh: "มหาวิทยาลัยราชภัฏกำแพงเพชร",
    nameEn: "Kamphaeng Phet Rajabhat University",
    brandName: "KPRU Wellness",
    logo: "/images/logo/KPRU_logo.png",
  },

  // ===== PRIVATE =====
  BU: {
    code: "BU",
    nameTh: "มหาวิทยาลัยกรุงเทพ",
    nameEn: "Bangkok University",
    brandName: "BU Wellness",
    logo: "/images/logo/BU_logo.png",
  },
  SPU: {
    code: "SPU",
    nameTh: "มหาวิทยาลัยศรีปทุม",
    nameEn: "Sripatum University",
    brandName: "SPU Wellness",
    logo: "/images/logo/SPU_logo.png",
  },
  UTCC: {
    code: "UTCC",
    nameTh: "มหาวิทยาลัยหอการค้าไทย",
    nameEn: "University of the Thai Chamber of Commerce",
    brandName: "UTCC Wellness",
    logo: "/images/logo/UTCC_logo.png",
  },
  RSU: {
    code: "RSU",
    nameTh: "มหาวิทยาลัยรังสิต",
    nameEn: "Rangsit University",
    brandName: "RSU Wellness",
    logo: "/images/logo/RSU_logo.png",
  },
  ABAC: {
    code: "ABAC",
    nameTh: "มหาวิทยาลัยอัสสัมชัญ",
    nameEn: "Assumption University",
    brandName: "ABAC Wellness",
    logo: "/images/logo/ABAC_logo.png",
  },
};

export function normalizeTenant(input?: string | null): TenantCode {
  const code = (input ?? "").toUpperCase().trim() as TenantCode;
  // ถ้าอยู่ใน TENANTS ให้ใช้เลย ไม่งั้น fallback
  return code in TENANTS ? code : "DEFAULT";
}
