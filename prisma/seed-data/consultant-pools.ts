// prisma/seed-data/consultant-pools.ts

export const languagePool = [
  { code: "TH", level: "NATIVE" },
  { code: "EN", level: "GOOD" },
  { code: "CN", level: "BASIC" },
] as const;

export const specializationPool = [
  {
    key: "ACAD",
    th: "แนะแนวการเรียน/การจัดการเวลา",
    en: "Academic Coaching & Time Management",
  },
  {
    key: "STRESS",
    th: "จัดการความเครียด/อารมณ์",
    en: "Stress & Emotion Management",
  },
  {
    key: "REL",
    th: "ความสัมพันธ์/การสื่อสาร",
    en: "Relationship & Communication",
  },
  {
    key: "FIN",
    th: "ความเครียดการเงิน/การวางแผน",
    en: "Financial Stress & Planning",
  },
  {
    key: "ADJ",
    th: "การปรับตัวในมหาลัย/ย้ายที่อยู่",
    en: "Adjustment to University Life",
  },
  {
    key: "MENTAL",
    th: "วิตกกังวล/ซึมเศร้า/แพนิค",
    en: "Anxiety, Depression & Panic",
  },
  {
    key: "SUBST",
    th: "สารเสพติด/พฤติกรรมเสพติด",
    en: "Substance Use & Behavioral Addiction",
  },
  { key: "FAM", th: "ครอบครัว/ความขัดแย้งในบ้าน", en: "Family Counseling" },
  {
    key: "HEALTH",
    th: "สุขภาพกายเรื้อรัง/ความเครียดจากโรค",
    en: "Chronic Illness & Health-related Stress",
  },
  {
    key: "CAREER",
    th: "อาชีพ/ความกดดันอนาคต",
    en: "Career & Future Planning",
  },
  {
    key: "BULLY",
    th: "บูลลี่/คุกคาม/ความรุนแรง",
    en: "Bullying, Harassment & Violence",
  },
  {
    key: "SEX",
    th: "เพศ/อัตลักษณ์/ความยินยอม",
    en: "Sexuality, Identity & Consent",
  },
  {
    key: "LEGAL",
    th: "กฎหมาย/วินัย/การโดนร้องเรียน",
    en: "Legal & Disciplinary Issues",
  },
  { key: "OTHER", th: "เคสทั่วไป/อื่นๆ", en: "General Counseling" },
] as const;

export type LanguagePoolItem = (typeof languagePool)[number];
export type SpecializationPoolItem = (typeof specializationPool)[number];
