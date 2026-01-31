// prisma/seed-data/people.ts

export type Bilingual = { th: string; en: string };

// -------------------------
// Raw lists (TH / EN)
// -------------------------
export const firstNamesTh = [
  "สมชาย","สมศักดิ์","มาลี","มณี","ปราณี","วิชัย","สุดา","นารี","อาทิตย์","กัญญา",
  "เดชา","พิชัย","รัตนา","สุนีย์","วิภา","ณรงค์","ศิริพร","ทองชัย","อุดม","วนิดา",
  "พงศักดิ์","ณัฐพงษ์","จิรวัฒน์","ชลิดา","ภาณุมัส","กฤษฎา","พิมพ์ชนก","ณิชา","ธนวัฒน์","ศิริน",
  "อนันต์","อภิญญา","ชัยวัฒน์","ชนลดา","ดำรง","ดรุณี","เอกชัย","หทัยรัตน์","อิสระ","จุฑามาศ",
  "กนกวรรณ","กรกนก","ลลิตา","มานพ","นพรัตน์","อรทัย","พัชรินทร์","รัชนี","ศักดา","ศศิธร",
  "ศุภชัย","สุพรรษา","ธัญญารัตน์","ธีรพงษ์","อุไร","วสันต์","ญาดา","หญิงยง",
];

export const firstNamesEn = [
  "Somchai","Somsak","Malee","Manee","Pranee","Wichai","Suda","Naree","Arthit","Kanya",
  "Decha","Pichai","Ratana","Sunee","Vipa","Narong","Siriporn","Thongchai","Udom","Wanida",
  "Pongsak","Nattapong","Jirawat","Chanida","Phanumas","Kritsada","Pimchanok","Nicha","Thanawat","Sirin",
  "Anan","Apinya","Chaiwat","Chonlada","Damrong","Darunee","Ekachai","Hathairat","Isara","Jutamas",
  "Kanokwan","Kornkanok","Lalita","Manop","Noppharat","Orathai","Phatcharin","Ratchanee","Sakda","Sasithorn",
  "Supachai","Suphansa","Thanyarat","Thirapong","Urai","Wasan","Yada","Yingyong",
];

export const lastNamesTh = [
  "ใจดี","มีวงศ์","รักชาติ","สุขใจ","มั่นใจ","คงทอง","ศรีสุข","วงศา","ปัญญา","แก้วตา",
  "โรจนะ","แซ่ตั้ง","แซ่ลี","ใจรัก","บุญมี","ชัยศรี","วงศ์สุวรรณ","อินทรา","พรหมา","ศรีเทพ",
  "คงแก้ว","สุวรรณ","ทองดี","รัตนาภรณ์","จันทรา","ศรีสวัสดิ์","เพชรมณี","พรหม","แก้วใส","ยิ้มแย้ม",
  "สุขประเสริฐ","วัฒนกุล","พงศ์ผล","กาญจนกุล","รุ่งโรจน์","ศิริกุล","จันทร","ภาสุข","สุขุม","รักษากุล",
  "ทองหล่อ","อุดมศรี","วิจิตรสกุล","สมศรี","บุญญรัตน์","ชื่นชม","สังข์อาน","สวัสดี","รัตนากร","มหาศิริ",
  "ประเสริฐสุข","โชคชัย","ศรีสมาย","พันธุ์ทอง","พงษธร","โชคนาน","ยินดี","สุขสันต์",
];

export const lastNamesEn = [
  "Jaidee","Meewong","Rakchart","Sukjai","Munjai","Kongthong","Srisuk","Wongsa","Panya","Kaewta",
  "Rojjana","Saetang","Saelee","Jairak","Boonmee","Chaisri","Wongsuwan","Intara","Promma","Srithep",
  "Kongkaew","Suwan","Thongdee","Rattanaporn","Chantara","Srisawat","Petchmanee","Phrom","Kaewsai","Yimyam",
  "Sukprasert","Wattanakul","Phongphol","Kanchanakul","Rungroj","Sirikul","Chantorn","Phasuk","Sukhum","Raksakul",
  "Thonglor","Udomsri","Wichitsakul","Somsri","Bunyarat","Chuenchom","Sanguan","Sawatdee","Rattanakorn","Mahasiri",
  "Prasertsuk","Chokchai","Srisamai","Phanthong","Pongsathon","Chokanan","Yindee","Suksan",
];

export const nicknamesTh = [
  "มด","ไก่","หมู","หนู","เล็ก","ใหญ่","ต้น","ส้ม","โอ๊ต","พิม","แนน","เมย์","เบส","เก่ง","พลอย","มิว","นิว","แบม","มิ้น","ตี๋",
  "ไอซ์","ฟิล์ม","อาร์ม","บอส","เกม","โน้ต","สกาย","เรน","บีม","กอล์ฟ","วิว","ป๊อกป๊อง","ทัช","ก้อง","แบงค์","มาร์ค","ไบรท์","เอิร์ธ","ซัน","มูน",
  "เจ","โจ","พีท","เคน","แม็กซ์","อเล็กซ์","นิค","ลุค","ลีโอ","คริส","แซม","ทอม","ไมค์","เบน","ฝน","ฟ้า","ข้าว","น้ำ","โอ","เอ","พี","เค",
];

export const nicknamesEn = [
  "Mod","Kai","Moo","Nu","Lek","Yai","Ton","Som","Oat","Pim","Nan","May","Best","Keng","Ploy","Mew","New","Bam","Mint","Tee",
  "Ice","Film","Arm","Boss","Game","Note","Sky","Rain","Beam","Golf","View","Pokpong","Touch","Kong","Bank","Mark","Bright","Earth","Sun","Moon",
  "Jay","Joe","Pete","Ken","Max","Alex","Nick","Luke","Leo","Chris","Sam","Tom","Mike","Ben","Fon","Fah","Khao","Nam","Oh","Ae","Pee","Kay",
];

// -------------------------
// Pair by index (TH <-> EN)
// -------------------------
function zipBilingual(th: string[], en: string[]): Bilingual[] {
  const n = Math.max(th.length, en.length);
  const out: Bilingual[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      th: th[i] ?? en[i] ?? `th_${i}`,
      en: en[i] ?? th[i] ?? `en_${i}`,
    });
  }
  return out;
}

export const firstNamePairs = zipBilingual(firstNamesTh, firstNamesEn);
export const lastNamePairs = zipBilingual(lastNamesTh, lastNamesEn);
export const nicknamePairs = zipBilingual(nicknamesTh, nicknamesEn);

export function randomBilingual(list: Bilingual[]): Bilingual {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomPerson() {
  return {
    first: randomBilingual(firstNamePairs),
    last: randomBilingual(lastNamePairs),
    nickname: randomBilingual(nicknamePairs),
  };
}

// -------------------------
// Backward compatible exports
// (ถ้าโค้ดเก่ายัง import firstNames/lastNames/nicknames)
// -------------------------
export const firstNames = firstNamesTh;
export const lastNames = lastNamesTh;
export const nicknames = nicknamesTh;

export const firstNamesEN = firstNamesEn;
export const lastNamesEN = lastNamesEn;
export const nicknamesEN = nicknamesEn;
