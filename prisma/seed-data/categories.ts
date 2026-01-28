// prisma/seed-data/categories.ts
export const categoriesData = [
  { code: "ACAD", th: "ปัญหาการเรียน", en: "Academic", desc: "เช่น เกรด/การปรับตัวด้านการเรียน" },
  { code: "STRESS", th: "ความเครียด", en: "Stress", desc: "เช่น ความเครียดจากการเรียน/งาน/ชีวิต" },
  { code: "REL", th: "ความสัมพันธ์", en: "Relationship", desc: "เช่น เพื่อน แฟน ครอบครัว" },
  { code: "ADJ", th: "การปรับตัว", en: "Adjustment", desc: "เช่น ปรับตัวเข้ามหาลัย/ย้ายที่อยู่" },
  { code: "FIN", th: "ปัญหาการเงิน", en: "Finance", desc: "เช่น ค่าใช้จ่าย/หนี้สิน" },
  { code: "MENTAL", th: "สุขภาพจิต/อารมณ์", en: "Mental Health", desc: "เช่น ซึมเศร้า วิตกกังวล แพนิค นอนไม่หลับ" },
  { code: "SUBST", th: "สารเสพติด/การเสพติด", en: "Substance Use", desc: "เช่น แอลกอฮอล์ บุหรี่ บุหรี่ไฟฟ้า ยาเสพติด การพนัน เกม" },
  { code: "FAM", th: "ครอบครัว", en: "Family", desc: "เช่น ความขัดแย้งในบ้าน ความคาดหวัง การหย่าร้าง" },
  { code: "HEALTH", th: "สุขภาพกาย", en: "Physical Health", desc: "เช่น เจ็บป่วยเรื้อรัง ความเครียดจากโรค การกิน/นอน" },
  { code: "CAREER", th: "อาชีพ/อนาคต", en: "Career", desc: "เช่น ฝึกงาน งานหลังเรียนต่อ ความไม่มั่นใจในเส้นทาง" },
  { code: "BULLY", th: "ถูกรังแก/ความรุนแรง", en: "Bullying & Violence", desc: "เช่น บูลลี่ในคลาส/ออนไลน์ ถูกคุกคาม" },
  { code: "SEX", th: "เพศสัมพันธ์/อัตลักษณ์", en: "Sexuality & Identity", desc: "เช่น ปัญหาเรื่องเพศ ความยินยอม LGBTQ+ ความสัมพันธ์เชิงเพศ" },
  { code: "LEGAL", th: "กฎหมาย/วินัย", en: "Legal & Discipline", desc: "เช่น คดี ความผิดวินัย การโดนร้องเรียน" },
  { code: "OTHER", th: "อื่นๆ", en: "Other", desc: "กรณีที่ไม่เข้าหมวดด้านบน" },
] as const;

export type ProblemCategoryCode = typeof categoriesData[number]["code"];
