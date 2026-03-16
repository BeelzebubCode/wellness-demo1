// RegionCode enum ถูกลบจาก Prisma schema แล้ว — ใช้ string constants แทน
const RegionCode = {
  UPPER_NORTH: "UPPER_NORTH",
  LOWER_NORTH: "LOWER_NORTH",
  UPPER_NORTHEAST: "UPPER_NORTHEAST",
  LOWER_NORTHEAST: "LOWER_NORTHEAST",
  UPPER_CENTRAL: "UPPER_CENTRAL",
  LOWER_CENTRAL: "LOWER_CENTRAL",
  EAST: "EAST",
  UPPER_SOUTH: "UPPER_SOUTH",
  LOWER_SOUTH: "LOWER_SOUTH",
} as const;
export const provincesData = [
  // ===== UPPER_CENTRAL (ภาคกลางตอนบน) =====
  // กรุงเทพฯและปริมณฑล + จังหวัดใกล้เคียง
  { code: "BKK", th: "กรุงเทพมหานคร", en: "Bangkok", region: RegionCode.UPPER_CENTRAL },
  { code: "SPK", th: "สมุทรปราการ", en: "Samut Prakan", region: RegionCode.UPPER_CENTRAL },
  { code: "NBI", th: "นนทบุรี", en: "Nonthaburi", region: RegionCode.UPPER_CENTRAL },
  { code: "PTE", th: "ปทุมธานี", en: "Pathum Thani", region: RegionCode.UPPER_CENTRAL },
  { code: "AYA", th: "พระนครศรีอยุธยา", en: "Ayutthaya", region: RegionCode.UPPER_CENTRAL },
  { code: "ATG", th: "อ่างทอง", en: "Ang Thong", region: RegionCode.UPPER_CENTRAL },
  { code: "LBY", th: "ลพบุรี", en: "Lopburi", region: RegionCode.UPPER_CENTRAL },
  { code: "SBR", th: "สิงห์บุรี", en: "Sing Buri", region: RegionCode.UPPER_CENTRAL },
  { code: "CNT", th: "ชัยนาท", en: "Chai Nat", region: RegionCode.UPPER_CENTRAL },
  { code: "SRB", th: "สระบุรี", en: "Saraburi", region: RegionCode.UPPER_CENTRAL },
  { code: "NPT", th: "นครปฐม", en: "Nakhon Pathom", region: RegionCode.UPPER_CENTRAL },
  { code: "SMK", th: "สมุทรสาคร", en: "Samut Sakhon", region: RegionCode.UPPER_CENTRAL },
  { code: "SMG", th: "สมุทรสงคราม", en: "Samut Songkhram", region: RegionCode.UPPER_CENTRAL },
  { code: "NSN", th: "นครสวรรค์", en: "Nakhon Sawan", region: RegionCode.UPPER_CENTRAL },
  { code: "UTI", th: "อุทัยธานี", en: "Uthai Thani", region: RegionCode.UPPER_CENTRAL },
  { code: "KPT", th: "กำแพงเพชร", en: "Kamphaeng Phet", region: RegionCode.UPPER_CENTRAL },

  // ===== LOWER_CENTRAL (ภาคกลางตอนล่าง) =====
  { code: "SPB", th: "สุพรรณบุรี", en: "Suphan Buri", region: RegionCode.LOWER_CENTRAL },
  { code: "PBI", th: "เพชรบุรี", en: "Phetchaburi", region: RegionCode.LOWER_CENTRAL },
  { code: "PKN", th: "ประจวบคีรีขันธ์", en: "Prachuap Khiri Khan", region: RegionCode.LOWER_CENTRAL },
  { code: "KCB", th: "กาญจนบุรี", en: "Kanchanaburi", region: RegionCode.LOWER_CENTRAL },
  { code: "RBR", th: "ราชบุรี", en: "Ratchaburi", region: RegionCode.LOWER_CENTRAL },
  { code: "TAK", th: "ตาก", en: "Tak", region: RegionCode.LOWER_CENTRAL },

  // ===== EAST (ภาคตะวันออก) =====
  { code: "CBI", th: "ชลบุรี", en: "Chonburi", region: RegionCode.EAST },
  { code: "RYG", th: "ระยอง", en: "Rayong", region: RegionCode.EAST },
  { code: "CTI", th: "จันทบุรี", en: "Chanthaburi", region: RegionCode.EAST },
  { code: "TRT", th: "ตราด", en: "Trat", region: RegionCode.EAST },
  { code: "CCO", th: "ฉะเชิงเทรา", en: "Chachoengsao", region: RegionCode.EAST },
  { code: "PJN", th: "ปราจีนบุรี", en: "Prachinburi", region: RegionCode.EAST },
  { code: "NYK", th: "นครนายก", en: "Nakhon Nayok", region: RegionCode.EAST },
  { code: "SKW", th: "สระแก้ว", en: "Sa Kaeo", region: RegionCode.EAST },

  // ===== LOWER_NORTHEAST (ภาคตะวันออกเฉียงเหนือตอนล่าง) =====
  { code: "NRM", th: "นครราชสีมา", en: "Nakhon Ratchasima", region: RegionCode.LOWER_NORTHEAST },
  { code: "BRM", th: "บุรีรัมย์", en: "Buriram", region: RegionCode.LOWER_NORTHEAST },
  { code: "SRN", th: "สุรินทร์", en: "Surin", region: RegionCode.LOWER_NORTHEAST },
  { code: "SSK", th: "ศรีสะเกษ", en: "Sisaket", region: RegionCode.LOWER_NORTHEAST },
  { code: "UBN", th: "อุบลราชธานี", en: "Ubon Ratchathani", region: RegionCode.LOWER_NORTHEAST },
  { code: "YST", th: "ยโสธร", en: "Yasothon", region: RegionCode.LOWER_NORTHEAST },
  { code: "ACR", th: "อำนาจเจริญ", en: "Amnat Charoen", region: RegionCode.LOWER_NORTHEAST },
  { code: "CYP", th: "ชัยภูมิ", en: "Chaiyaphum", region: RegionCode.LOWER_NORTHEAST },
  { code: "MKM", th: "มหาสารคาม", en: "Maha Sarakham", region: RegionCode.LOWER_NORTHEAST },
  { code: "RET", th: "ร้อยเอ็ด", en: "Roi Et", region: RegionCode.LOWER_NORTHEAST },

  // ===== UPPER_NORTHEAST (ภาคตะวันออกเฉียงเหนือตอนบน) =====
  { code: "KKN", th: "ขอนแก่น", en: "Khon Kaen", region: RegionCode.UPPER_NORTHEAST },
  { code: "UDN", th: "อุดรธานี", en: "Udon Thani", region: RegionCode.UPPER_NORTHEAST },
  { code: "LEI", th: "เลย", en: "Loei", region: RegionCode.UPPER_NORTHEAST },
  { code: "NKI", th: "หนองคาย", en: "Nong Khai", region: RegionCode.UPPER_NORTHEAST },
  { code: "BKN", th: "บึงกาฬ", en: "Bueng Kan", region: RegionCode.UPPER_NORTHEAST },
  { code: "NBL", th: "หนองบัวลำภู", en: "Nong Bua Lamphu", region: RegionCode.UPPER_NORTHEAST },
  { code: "KSN", th: "กาฬสินธุ์", en: "Kalasin", region: RegionCode.UPPER_NORTHEAST },
  { code: "SNK", th: "สกลนคร", en: "Sakon Nakhon", region: RegionCode.UPPER_NORTHEAST },
  { code: "NPM", th: "นครพนม", en: "Nakhon Phanom", region: RegionCode.UPPER_NORTHEAST },
  { code: "MDH", th: "มุกดาหาร", en: "Mukdahan", region: RegionCode.UPPER_NORTHEAST },

  // ===== UPPER_NORTH (ภาคเหนือตอนบน) =====
  { code: "CNX", th: "เชียงใหม่", en: "Chiang Mai", region: RegionCode.UPPER_NORTH },
  { code: "LPN", th: "ลำพูน", en: "Lamphun", region: RegionCode.UPPER_NORTH },
  { code: "CRI", th: "เชียงราย", en: "Chiang Rai", region: RegionCode.UPPER_NORTH },
  { code: "MSN", th: "แม่ฮ่องสอน", en: "Mae Hong Son", region: RegionCode.UPPER_NORTH },
  { code: "PYO", th: "พะเยา", en: "Phayao", region: RegionCode.UPPER_NORTH },
  { code: "NAN", th: "น่าน", en: "Nan", region: RegionCode.UPPER_NORTH },
  { code: "PRE", th: "แพร่", en: "Phrae", region: RegionCode.UPPER_NORTH },

  // ===== LOWER_NORTH (ภาคเหนือตอนล่าง) =====
  { code: "LPG", th: "ลำปาง", en: "Lampang", region: RegionCode.LOWER_NORTH },
  { code: "UTT", th: "อุตรดิตถ์", en: "Uttaradit", region: RegionCode.LOWER_NORTH },
  { code: "STI", th: "สุโขทัย", en: "Sukhothai", region: RegionCode.LOWER_NORTH },
  { code: "PHS", th: "พิษณุโลก", en: "Phitsanulok", region: RegionCode.LOWER_NORTH },
  { code: "PCT", th: "พิจิตร", en: "Phichit", region: RegionCode.LOWER_NORTH },
  { code: "PCB", th: "เพชรบูรณ์", en: "Phetchabun", region: RegionCode.LOWER_NORTH },

  // ===== UPPER_SOUTH (ภาคใต้ตอนบน) =====
  { code: "CPN", th: "ชุมพร", en: "Chumphon", region: RegionCode.UPPER_SOUTH },
  { code: "RNG", th: "ระนอง", en: "Ranong", region: RegionCode.UPPER_SOUTH },
  { code: "SRT", th: "สุราษฎร์ธานี", en: "Surat Thani", region: RegionCode.UPPER_SOUTH },
  { code: "PNG", th: "พังงา", en: "Phang Nga", region: RegionCode.UPPER_SOUTH },
  { code: "PSN", th: "ภูเก็ต", en: "Phuket", region: RegionCode.UPPER_SOUTH },
  { code: "KBI", th: "กระบี่", en: "Krabi", region: RegionCode.UPPER_SOUTH },
  { code: "NST", th: "นครศรีธรรมราช", en: "Nakhon Si Thammarat", region: RegionCode.UPPER_SOUTH },

  // ===== LOWER_SOUTH (ภาคใต้ตอนล่าง) =====
  { code: "SKA", th: "สงขลา", en: "Songkhla", region: RegionCode.LOWER_SOUTH },
  { code: "STN", th: "สตูล", en: "Satun", region: RegionCode.LOWER_SOUTH },
  { code: "TRG", th: "ตรัง", en: "Trang", region: RegionCode.LOWER_SOUTH },
  { code: "PLG", th: "พัทลุง", en: "Phatthalung", region: RegionCode.LOWER_SOUTH },
  { code: "PTN", th: "ปัตตานี", en: "Pattani", region: RegionCode.LOWER_SOUTH },
  { code: "YLA", th: "ยะลา", en: "Yala", region: RegionCode.LOWER_SOUTH },
  { code: "NWT", th: "นราธิวาส", en: "Narathiwat", region: RegionCode.LOWER_SOUTH },
] as const;
