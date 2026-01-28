export const universitiesData = [
  {
    code: "NU",
    th: "มหาวิทยาลัยนเรศวร",
    en: "Naresuan University",
    province_code: "PHS", // พิษณุโลก
    is_active: true,
  },
  {
    code: "KKU",
    th: "มหาวิทยาลัยขอนแก่น",
    en: "Khon Kaen University",
    province_code: "KKN", // ขอนแก่น
    is_active: true,
  },
  {
    code: "CU",
    th: "จุฬาลงกรณ์มหาวิทยาลัย",
    en: "Chulalongkorn University",
    province_code: "BKK", // กรุงเทพมหานคร
    is_active: true,
  },
] as const;

export type UniversitySeedItem = (typeof universitiesData)[number];
