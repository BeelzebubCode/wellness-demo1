// prisma/seed-data/faculties.ts

export const FACULTIES = [
  { code: "ENG", th: "คณะวิศวกรรมศาสตร์", en: "Engineering" },
  { code: "SCI", th: "คณะวิทยาศาสตร์", en: "Science" },
  {
    code: "ICT",
    th: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    en: "Information & Communication Technology",
  },
  { code: "MED", th: "คณะแพทยศาสตร์", en: "Medicine" },
  { code: "NUR", th: "คณะพยาบาลศาสตร์", en: "Nursing" },
  { code: "PHA", th: "คณะเภสัชศาสตร์", en: "Pharmacy" },
  { code: "LAW", th: "คณะนิติศาสตร์", en: "Law" },
  { code: "BUS", th: "คณะบริหารธุรกิจ", en: "Business Administration" },
] as const;

export const DEPARTMENTS: Array<{
  facultyCode: (typeof FACULTIES)[number]["code"];
  code: string;
  th: string;
  en: string;
}> = [
  // ENG
  {
    facultyCode: "ENG",
    code: "CPE",
    th: "วิศวกรรมคอมพิวเตอร์",
    en: "Computer Engineering",
  },
  {
    facultyCode: "ENG",
    code: "EE",
    th: "วิศวกรรมไฟฟ้า",
    en: "Electrical Engineering",
  },
  {
    facultyCode: "ENG",
    code: "ME",
    th: "วิศวกรรมเครื่องกล",
    en: "Mechanical Engineering",
  },

  // SCI
  {
    facultyCode: "SCI",
    code: "CS",
    th: "วิทยาการคอมพิวเตอร์",
    en: "Computer Science",
  },
  { facultyCode: "SCI", code: "MATH", th: "คณิตศาสตร์", en: "Mathematics" },
  { facultyCode: "SCI", code: "STAT", th: "สถิติ", en: "Statistics" },

  // ICT
  {
    facultyCode: "ICT",
    code: "IT",
    th: "เทคโนโลยีสารสนเทศ",
    en: "Information Technology",
  },
  {
    facultyCode: "ICT",
    code: "SE",
    th: "วิศวกรรมซอฟต์แวร์",
    en: "Software Engineering",
  },
  { facultyCode: "ICT", code: "DS", th: "วิทยาการข้อมูล", en: "Data Science" },

  // MED / NUR / PHA
  {
    facultyCode: "MED",
    code: "MEDGEN",
    th: "แพทยศาสตร์",
    en: "Doctor of Medicine",
  },
  { facultyCode: "NUR", code: "NURGEN", th: "พยาบาลศาสตร์", en: "Nursing" },
  { facultyCode: "PHA", code: "PHARM", th: "เภสัชศาสตร์", en: "Pharmacy" },

  // LAW / BUS
  { facultyCode: "LAW", code: "LAWGEN", th: "นิติศาสตร์", en: "Law" },
  { facultyCode: "BUS", code: "ACC", th: "การบัญชี", en: "Accounting" },
  { facultyCode: "BUS", code: "MKT", th: "การตลาด", en: "Marketing" },
];
