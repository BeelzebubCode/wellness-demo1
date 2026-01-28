// seed-data/provinces.ts
import { RegionCode } from "@prisma/client";

export const provincesData = [
  // ===== NORTH =====
  { code: "CNX", th: "เชียงใหม่", en: "Chiang Mai", region: RegionCode.NORTH },
  { code: "LPG", th: "ลำปาง", en: "Lampang", region: RegionCode.NORTH },
  { code: "PHS", th: "พิษณุโลก", en: "Phitsanulok", region: RegionCode.NORTH },
  { code: "UTT", th: "อุตรดิตถ์", en: "Uttaradit", region: RegionCode.NORTH },

  // ===== CENTRAL =====
  { code: "BKK", th: "กรุงเทพมหานคร", en: "Bangkok", region: RegionCode.CENTRAL },
  { code: "AYA", th: "พระนครศรีอยุธยา", en: "Ayutthaya", region: RegionCode.CENTRAL },
  { code: "NPT", th: "นครปฐม", en: "Nakhon Pathom", region: RegionCode.CENTRAL },
  { code: "SPB", th: "สุพรรณบุรี", en: "Suphan Buri", region: RegionCode.CENTRAL },

  // ===== NORTHEAST =====
  { code: "KKN", th: "ขอนแก่น", en: "Khon Kaen", region: RegionCode.NORTHEAST },
  { code: "UDN", th: "อุดรธานี", en: "Udon Thani", region: RegionCode.NORTHEAST },
  { code: "UBN", th: "อุบลราชธานี", en: "Ubon Ratchathani", region: RegionCode.NORTHEAST },
  { code: "NRM", th: "นครราชสีมา", en: "Nakhon Ratchasima", region: RegionCode.NORTHEAST },

  // ===== EAST =====
  { code: "CBI", th: "ชลบุรี", en: "Chonburi", region: RegionCode.EAST },
  { code: "RYG", th: "ระยอง", en: "Rayong", region: RegionCode.EAST },

  // ===== SOUTH =====
  { code: "PSN", th: "ภูเก็ต", en: "Phuket", region: RegionCode.SOUTH },
  { code: "SKA", th: "สงขลา", en: "Songkhla", region: RegionCode.SOUTH },
];
