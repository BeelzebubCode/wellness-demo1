// prisma/seed.ts
import {
  PrismaClient,
  AccountRole,
  BookingStatus,
  StudentGender,
  StudentAddressType,
  TimeSlotStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* =========================================================
  Helpers
========================================================= */
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomBool = (p = 0.5) => Math.random() < p;

const firstNames = [
  "Somchai","Somsak","Malee","Manee","Pranee","Wichai","Suda","Naree","Arthit","Kanya",
  "Decha","Pichai","Ratana","Sunee","Vipa","Narong","Siriporn","Thongchai","Udom","Wanida",
  "Pongsak","Nattapong","Jirawat","Chanida","Phanumas","Kritsada","Pimchanok","Nicha","Thanawat","Sirin",
];
const lastNames = [
  "Jaidee","Meewong","Rakchart","Sukjai","Munjai","Kongthong","Srisuk","Wongsa","Panya","Kaewta",
  "Rojjana","Saetang","Saelee","Jairak","Boonmee","Chaisri","Wongsuwan","Intara","Promma","Srithep",
  "Kongkaew","Suwan","Thongdee","Rattanaporn","Chantara","Srisawat","Petchmanee","Phrom","Kaewsai","Yimyam",
];
const nicknames = ["Mod","Kai","Moo","Nu","Lek","Yai","Ton","Som","Oat","Pim","Nan","May","Best","Keng","Ploy","Mew","New","Bam","Mint","Tee"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/* =========================================================
  Clear DB (DEV only)
========================================================= */
async function clearDbIfNeeded() {
  const CLEAR = process.env.CLEAR_DB === "1";
  if (!CLEAR) return;

  console.log("🧨 CLEAR_DB=1 → clearing tables (DEV ONLY) ...");

  // delete children first
  await prisma.notification.deleteMany();
  await prisma.notificationTemplate.deleteMany();

  await prisma.feedbackComment.deleteMany();
  await prisma.feedbackRating.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.evaluationCriterion.deleteMany();

  await prisma.bookingCancellation.deleteMany();
  await prisma.bookingOutcome.deleteMany();
  await prisma.bookingAssignment.deleteMany();
  await prisma.booking.deleteMany();

  await prisma.timeSlot.deleteMany();

  await prisma.consultantSpecialization.deleteMany();
  await prisma.consultantLanguage.deleteMany();
  await prisma.consultantProfile.deleteMany();
  await prisma.consultant.deleteMany();

  await prisma.studentAddress.deleteMany();
  await prisma.studentAcademic.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.student.deleteMany();

  await prisma.advisor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();

  await prisma.province.deleteMany();
  await prisma.problemCategory.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.studentStatus.deleteMany();

  await prisma.account.deleteMany();

  console.log("✅ cleared.");
}

/* =========================================================
  Seed Data (Thai university style faculties + departments)
========================================================= */

// “คณะ” แบบมหาลัยไทย (จัดเต็ม)
const FACULTIES = [
  { code: "ENG", th: "วิศวกรรมศาสตร์", en: "Engineering" },
  { code: "SCI", th: "วิทยาศาสตร์", en: "Science" },
  { code: "ICT", th: "เทคโนโลยีสารสนเทศและการสื่อสาร", en: "Information & Communication Technology" },
  { code: "MED", th: "แพทยศาสตร์", en: "Medicine" },
  { code: "NUR", th: "พยาบาลศาสตร์", en: "Nursing" },
  { code: "PHA", th: "เภสัชศาสตร์", en: "Pharmacy" },
  { code: "DEN", th: "ทันตแพทยศาสตร์", en: "Dentistry" },
  { code: "PHAH", th: "สาธารณสุขศาสตร์", en: "Public Health" },
  { code: "AHS", th: "สหเวชศาสตร์", en: "Allied Health Sciences" },
  { code: "EDU", th: "ศึกษาศาสตร์", en: "Education" },
  { code: "HUM", th: "มนุษยศาสตร์", en: "Humanities" },
  { code: "SOC", th: "สังคมศาสตร์", en: "Social Sciences" },
  { code: "BUS", th: "บริหารธุรกิจ", en: "Business Administration" },
  { code: "ECO", th: "เศรษฐศาสตร์", en: "Economics" },
  { code: "LAW", th: "นิติศาสตร์", en: "Law" },
  { code: "ARC", th: "สถาปัตยกรรมศาสตร์", en: "Architecture" },
  { code: "AGR", th: "เกษตรศาสตร์", en: "Agriculture" },
  { code: "ART", th: "ศิลปกรรมศาสตร์", en: "Fine Arts" },
  { code: "COM", th: "นิเทศศาสตร์", en: "Communication Arts" },
  { code: "TOUR", th: "การท่องเที่ยวและการโรงแรม", en: "Tourism & Hospitality" },
];

// “สาขา/ภาควิชา” แบบมหาลัยไทย (เยอะพอให้ใช้จริง)
const DEPARTMENTS: Array<{ facultyCode: string; code: string; th: string; en: string }> = [
  // ENG
  { facultyCode: "ENG", code: "CPE", th: "วิศวกรรมคอมพิวเตอร์", en: "Computer Engineering" },
  { facultyCode: "ENG", code: "EE", th: "วิศวกรรมไฟฟ้า", en: "Electrical Engineering" },
  { facultyCode: "ENG", code: "ME", th: "วิศวกรรมเครื่องกล", en: "Mechanical Engineering" },
  { facultyCode: "ENG", code: "CE", th: "วิศวกรรมโยธา", en: "Civil Engineering" },
  { facultyCode: "ENG", code: "IE", th: "วิศวกรรมอุตสาหการ", en: "Industrial Engineering" },
  { facultyCode: "ENG", code: "CHE", th: "วิศวกรรมเคมี", en: "Chemical Engineering" },
  { facultyCode: "ENG", code: "ENV", th: "วิศวกรรมสิ่งแวดล้อม", en: "Environmental Engineering" },

  // SCI
  { facultyCode: "SCI", code: "CS", th: "วิทยาการคอมพิวเตอร์", en: "Computer Science" },
  { facultyCode: "SCI", code: "MATH", th: "คณิตศาสตร์", en: "Mathematics" },
  { facultyCode: "SCI", code: "STAT", th: "สถิติ", en: "Statistics" },
  { facultyCode: "SCI", code: "PHYS", th: "ฟิสิกส์", en: "Physics" },
  { facultyCode: "SCI", code: "CHEM", th: "เคมี", en: "Chemistry" },
  { facultyCode: "SCI", code: "BIO", th: "ชีววิทยา", en: "Biology" },
  { facultyCode: "SCI", code: "MICRO", th: "จุลชีววิทยา", en: "Microbiology" },

  // ICT
  { facultyCode: "ICT", code: "IT", th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" },
  { facultyCode: "ICT", code: "SE", th: "วิศวกรรมซอฟต์แวร์", en: "Software Engineering" },
  { facultyCode: "ICT", code: "DS", th: "วิทยาการข้อมูล", en: "Data Science" },
  { facultyCode: "ICT", code: "CY", th: "ความมั่นคงปลอดภัยไซเบอร์", en: "Cybersecurity" },
  { facultyCode: "ICT", code: "IS", th: "ระบบสารสนเทศ", en: "Information Systems" },

  // MED / Health
  { facultyCode: "MED", code: "MEDGEN", th: "แพทยศาสตร์", en: "Doctor of Medicine" },
  { facultyCode: "NUR", code: "NURGEN", th: "พยาบาลศาสตร์", en: "Nursing" },
  { facultyCode: "PHA", code: "PHARM", th: "เภสัชศาสตร์", en: "Pharmacy" },
  { facultyCode: "DEN", code: "DENT", th: "ทันตแพทยศาสตร์", en: "Dentistry" },
  { facultyCode: "PHAH", code: "PH", th: "สาธารณสุขศาสตร์", en: "Public Health" },
  { facultyCode: "AHS", code: "PT", th: "กายภาพบำบัด", en: "Physical Therapy" },
  { facultyCode: "AHS", code: "MT", th: "เทคนิคการแพทย์", en: "Medical Technology" },

  // EDU
  { facultyCode: "EDU", code: "EDGEN", th: "การศึกษา", en: "Education" },
  { facultyCode: "EDU", code: "EDTECH", th: "เทคโนโลยีการศึกษา", en: "Educational Technology" },

  // HUM / SOC
  { facultyCode: "HUM", code: "THAI", th: "ภาษาไทย", en: "Thai" },
  { facultyCode: "HUM", code: "ENG_LANG", th: "ภาษาอังกฤษ", en: "English" },
  { facultyCode: "HUM", code: "JPN", th: "ภาษาญี่ปุ่น", en: "Japanese" },
  { facultyCode: "HUM", code: "HIS", th: "ประวัติศาสตร์", en: "History" },

  { facultyCode: "SOC", code: "PSY", th: "จิตวิทยา", en: "Psychology" },
  { facultyCode: "SOC", code: "POL", th: "รัฐศาสตร์", en: "Political Science" },
  { facultyCode: "SOC", code: "SOCIO", th: "สังคมวิทยา", en: "Sociology" },
  { facultyCode: "SOC", code: "IR", th: "ความสัมพันธ์ระหว่างประเทศ", en: "International Relations" },

  // BUS / ECO / LAW
  { facultyCode: "BUS", code: "ACC", th: "บัญชี", en: "Accounting" },
  { facultyCode: "BUS", code: "MKT", th: "การตลาด", en: "Marketing" },
  { facultyCode: "BUS", code: "FIN", th: "การเงิน", en: "Finance" },
  { facultyCode: "BUS", code: "HR", th: "ทรัพยากรมนุษย์", en: "Human Resource Management" },
  { facultyCode: "ECO", code: "ECON", th: "เศรษฐศาสตร์", en: "Economics" },
  { facultyCode: "LAW", code: "LAWGEN", th: "นิติศาสตร์", en: "Law" },

  // ARC / AGR / ART / COM / TOUR
  { facultyCode: "ARC", code: "ARCH", th: "สถาปัตยกรรม", en: "Architecture" },
  { facultyCode: "ARC", code: "INTDES", th: "ออกแบบภายใน", en: "Interior Design" },
  { facultyCode: "AGR", code: "AGRI", th: "เกษตรศาสตร์", en: "Agriculture" },
  { facultyCode: "AGR", code: "FOOD", th: "เทคโนโลยีอาหาร", en: "Food Technology" },
  { facultyCode: "ART", code: "FA", th: "ศิลปกรรม", en: "Fine Arts" },
  { facultyCode: "COM", code: "COMART", th: "นิเทศศาสตร์", en: "Communication Arts" },
  { facultyCode: "TOUR", code: "HOTEL", th: "การโรงแรม", en: "Hotel Management" },
  { facultyCode: "TOUR", code: "TOUR", th: "การท่องเที่ยว", en: "Tourism" },
];

async function main() {
  console.log("🌱 Starting FULL seed (PostgreSQL + your current schema) ...");
  await clearDbIfNeeded();

  /* =========================================================
    Password policy
  ========================================================= */
  const PLAIN_PASSWORD = "wellness@nu.ac.th_123456!";
  const PASSWORD_HASH = await bcrypt.hash(PLAIN_PASSWORD, 10);

  /* =========================================================
    1) Static tables
  ========================================================= */

  // StudentStatus
  const statusActive = await prisma.studentStatus.upsert({
    where: { student_status_code: "ACTIVE" },
    update: { student_status_detail: "กำลังศึกษา" },
    create: { student_status_code: "ACTIVE", student_status_detail: "กำลังศึกษา" },
  });

  const statusInactive = await prisma.studentStatus.upsert({
    where: { student_status_code: "INACTIVE" },
    update: { student_status_detail: "พักการศึกษา/ลาออก" },
    create: { student_status_code: "INACTIVE", student_status_detail: "พักการศึกษา/ลาออก" },
  });

  // Organization
  const org = await prisma.organization.upsert({
    where: { organization_name: "Counseling Center" },
    update: { organization_type: "Internal" },
    create: { organization_name: "Counseling Center", organization_type: "Internal" },
  });

  // Provinces (เอาใช้จริงพอสำหรับ address)
  const provincesData = [
    { code: "PHS", th: "พิษณุโลก", en: "Phitsanulok" },
    { code: "BKK", th: "กรุงเทพมหานคร", en: "Bangkok" },
    { code: "CMI", th: "เชียงใหม่", en: "Chiang Mai" },
    { code: "KKN", th: "ขอนแก่น", en: "Khon Kaen" },
    { code: "NKI", th: "นครราชสีมา", en: "Nakhon Ratchasima" },
    { code: "SNI", th: "สงขลา", en: "Songkhla" },
    { code: "CPN", th: "ชลบุรี", en: "Chonburi" },
  ];
  const provinces = [];
  for (const p of provincesData) {
    provinces.push(
      await prisma.province.upsert({
        where: { province_code: p.code },
        update: { province_name_th: p.th, province_name_en: p.en },
        create: { province_code: p.code, province_name_th: p.th, province_name_en: p.en },
      })
    );
  }

  // Faculties
  const facultyByCode = new Map<string, { faculty_id: number; faculty_code: string }>();
  for (const f of FACULTIES) {
    const created = await prisma.faculty.upsert({
      where: { faculty_code: f.code },
      update: { faculty_name_th: f.th, faculty_name_en: f.en },
      create: { faculty_code: f.code, faculty_name_th: f.th, faculty_name_en: f.en },
    });
    facultyByCode.set(f.code, created);
  }

  // Departments
  const deptByCode = new Map<string, { department_id: number; department_code: string; faculty_id: number }>();
  for (const d of DEPARTMENTS) {
    const fac = facultyByCode.get(d.facultyCode);
    if (!fac) continue;

    const created = await prisma.department.upsert({
      where: { department_code: d.code },
      update: {
        faculty_id: fac.faculty_id,
        department_name_th: d.th,
        department_name_en: d.en,
      },
      create: {
        faculty_id: fac.faculty_id,
        department_code: d.code,
        department_name_th: d.th,
        department_name_en: d.en,
      },
    });

    deptByCode.set(d.code, created);
  }

  // Advisors (สร้าง 1 คนต่อ department แบบกันซ้ำด้วย email)
  const advisors = [];
  for (const d of DEPARTMENTS) {
    const fac = facultyByCode.get(d.facultyCode);
    const dep = deptByCode.get(d.code);
    if (!fac || !dep) continue;

    const email = `advisor_${d.code.toLowerCase()}@university.ac.th`;
    const existing = await prisma.advisor.findFirst({ where: { advisor_email: email } });
    if (existing) {
      advisors.push(existing);
      continue;
    }

    const created = await prisma.advisor.create({
      data: {
        faculty_id: fac.faculty_id,
        department_id: dep.department_id,
        advisor_academic_rank: randomItem(["Asst. Prof.", "Assoc. Prof.", "Lecturer"]),
        advisor_prefix: randomItem(["อ.", "ผศ.", "รศ."]) as any,
        advisor_first_name: randomItem(firstNames),
        advisor_last_name: randomItem(lastNames),
        advisor_email: email,
        advisor_phone_number: `0${randomInt(800000000, 899999999)}`,
        advisor_office_location: `Building ${randomItem(["A", "B", "C", "D"])}, Room ${randomInt(101, 499)}`,
      },
    });
    advisors.push(created);
  }

  // ProblemCategory
  const categoriesData = [
    { code: "ACAD", th: "การเรียน", desc: "ปัญหาเรื่องเกรด, การเรียนไม่ทัน" },
    { code: "STRESS", th: "ความเครียด", desc: "ความเครียดวิตกกังวลทั่วไป" },
    { code: "REL", th: "ความสัมพันธ์", desc: "เพื่อน, แฟน, ครอบครัว" },
    { code: "ADJ", th: "การปรับตัว", desc: "การปรับตัวเข้ากับมหาวิทยาลัย" },
    { code: "FIN", th: "การเงิน", desc: "ทุนการศึกษา, ค่าใช้จ่าย" },
  ];
  const problemCategories = [];
  for (const c of categoriesData) {
    problemCategories.push(
      await prisma.problemCategory.upsert({
        where: { problem_category_code: c.code },
        update: {
          problem_category_name_th: c.th,
          problem_category_name_en: c.code,
          problem_category_description: c.desc,
        },
        create: {
          problem_category_code: c.code,
          problem_category_name_th: c.th,
          problem_category_name_en: c.code,
          problem_category_description: c.desc,
        },
      })
    );
  }

  // EvaluationCriterion
  const criteriaData = [
    { th: "ความพึงพอใจโดยรวม", en: "Overall satisfaction", w: "1.00", order: 1 },
    { th: "ความชัดเจนของคำแนะนำ", en: "Clarity", w: "1.00", order: 2 },
    { th: "ทักษะการรับฟัง", en: "Listening", w: "1.00", order: 3 },
    { th: "ความเป็นส่วนตัวและความไว้วางใจ", en: "Privacy & trust", w: "1.00", order: 4 },
  ];
  const criteria = [];
  for (const c of criteriaData) {
    const existing = await prisma.evaluationCriterion.findFirst({
      where: { evaluation_criterion_topic_th: c.th },
    });
    if (existing) {
      criteria.push(existing);
      continue;
    }
    criteria.push(
      await prisma.evaluationCriterion.create({
        data: {
          evaluation_criterion_topic_th: c.th,
          evaluation_criterion_topic_en: c.en,
          evaluation_criterion_weight: c.w as any,
          evaluation_criterion_display_order: c.order,
        },
      })
    );
  }

  // NotificationTemplate
  const tplCreated = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: "BOOKING_CREATED" },
    update: {
      notification_template_title: "สร้างนัดหมายสำเร็จ",
      notification_template_body: "ระบบได้รับคำขอจองของคุณแล้ว กรุณารอการมอบหมายที่ปรึกษา",
      notification_template_format: "TEXT",
    },
    create: {
      notification_template_code: "BOOKING_CREATED",
      notification_template_title: "สร้างนัดหมายสำเร็จ",
      notification_template_body: "ระบบได้รับคำขอจองของคุณแล้ว กรุณารอการมอบหมายที่ปรึกษา",
      notification_template_format: "TEXT",
    },
  });

  const tplAssigned = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: "BOOKING_ASSIGNED" },
    update: {
      notification_template_title: "มอบหมายที่ปรึกษาแล้ว",
      notification_template_body: "ระบบได้มอบหมายที่ปรึกษาให้คุณเรียบร้อยแล้ว",
      notification_template_format: "TEXT",
    },
    create: {
      notification_template_code: "BOOKING_ASSIGNED",
      notification_template_title: "มอบหมายที่ปรึกษาแล้ว",
      notification_template_body: "ระบบได้มอบหมายที่ปรึกษาให้คุณเรียบร้อยแล้ว",
      notification_template_format: "TEXT",
    },
  });

  /* =========================================================
    2) Accounts: head admin (username = head)
  ========================================================= */
  const headAccount = await prisma.account.upsert({
    where: { account_username: "head" },
    update: { account_role: AccountRole.HEAD_CONSULTANT, account_password: PASSWORD_HASH },
    create: {
      account_username: "head",
      account_password: PASSWORD_HASH,
      account_role: AccountRole.HEAD_CONSULTANT,
      account_line_id: null,
    },
  });

  /* =========================================================
    3) Consultants (consultant1..consultant5)
  ========================================================= */
  const consultants = [];
  const languagePool = [
    { code: "TH", level: "NATIVE" },
    { code: "EN", level: "GOOD" },
    { code: "CN", level: "BASIC" },
  ];
  const specializationPool = [
    "Stress Management",
    "Academic Counseling",
    "Relationship Counseling",
    "Financial Stress",
    "Adjustment to University",
  ];

  for (let i = 1; i <= 5; i++) {
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);

    const acc = await prisma.account.upsert({
      where: { account_username: `consultant${i}` },
      update: { account_role: AccountRole.CONSULTANT, account_password: PASSWORD_HASH },
      create: {
        account_username: `consultant${i}`,
        account_password: PASSWORD_HASH,
        account_role: AccountRole.CONSULTANT,
      },
    });

    let consultant = await prisma.consultant.findFirst({ where: { account_id: acc.account_id } });
    if (!consultant) {
      consultant = await prisma.consultant.create({
        data: { account_id: acc.account_id, organization_id: org.organization_id },
      });
    }

    await prisma.consultantProfile.upsert({
      where: { consultant_id: consultant.consultant_id },
      update: {
        consultant_first_name: fname,
        consultant_last_name: lname,
        consultant_nickname: randomItem(nicknames),
        consultant_email: `consultant${i}@university.ac.th`,
        consultant_gender: "MALE",
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
      create: {
        consultant_id: consultant.consultant_id,
        consultant_first_name: fname,
        consultant_last_name: lname,
        consultant_nickname: randomItem(nicknames),
        consultant_email: `consultant${i}@university.ac.th`,
        consultant_gender: "MALE",
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
    });

    // languages (unique composite)
    const langCount = randomInt(1, 2);
    const pickedLangCodes = Array.from(
      new Set(Array.from({ length: langCount }, () => randomItem(languagePool).code))
    );
    for (const code of pickedLangCodes) {
      const l = languagePool.find((x) => x.code === code)!;
      await prisma.consultantLanguage.upsert({
        where: {
          consultant_id_consultant_language_code: {
            consultant_id: consultant.consultant_id,
            consultant_language_code: l.code,
          },
        },
        update: { consultant_language_fluency_level: l.level },
        create: {
          consultant_id: consultant.consultant_id,
          consultant_language_code: l.code,
          consultant_language_fluency_level: l.level,
        },
      });
    }

    // specialization (unique composite)
    const specCount = randomInt(1, 2);
    const pickedSpecs = Array.from(
      new Set(Array.from({ length: specCount }, () => randomItem(specializationPool)))
    );
    for (const s of pickedSpecs) {
      await prisma.consultantSpecialization.upsert({
        where: {
          consultant_id_consultant_specialization_topic: {
            consultant_id: consultant.consultant_id,
            consultant_specialization_topic: s,
          },
        },
        update: {},
        create: { consultant_id: consultant.consultant_id, consultant_specialization_topic: s },
      });
    }

    consultants.push(consultant);
  }

  /* =========================================================
    4) Students (student1..student20)
       - student10..student20 มี booking
       - student1..student9 ไม่มี booking
       - academic: ผูก faculty/department แบบ realist
  ========================================================= */
  const students = [];
  const deptList = Array.from(deptByCode.values());

  for (let i = 1; i <= 20; i++) {
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);
    const gender = randomItem(Object.values(StudentGender));
    const lineId = `U_MOCK_${1000000000 + i}`;

    const acc = await prisma.account.upsert({
      where: { account_username: `student${i}` },
      update: {
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
        account_password: PASSWORD_HASH,
      },
      create: {
        account_username: `student${i}`,
        account_password: PASSWORD_HASH,
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
      },
    });

    let student = await prisma.student.findFirst({ where: { account_id: acc.account_id } });
    if (!student) {
      student = await prisma.student.create({
        data: {
          account_id: acc.account_id,
          student_status_id: i % 10 === 0 ? statusInactive.student_status_id : statusActive.student_status_id,
          student_code: `660${1000 + i}`,
        },
      });
    }

    await prisma.studentProfile.upsert({
      where: { student_id: student.student_id },
      update: {
        student_first_name: fname,
        student_last_name: lname,
        student_nickname: randomItem(nicknames),
        student_gender: gender,
        student_birthday: new Date(`200${randomInt(2, 6)}-${randomInt(1, 12)}-${randomInt(1, 28)}`),
        student_phone_number: `08${randomInt(10000000, 99999999)}`,
        student_email: `student${i}@student.university.ac.th`,
        student_prefix: randomItem(["นาย", "นางสาว", "คุณ"]) as any,
      },
      create: {
        student_id: student.student_id,
        student_first_name: fname,
        student_last_name: lname,
        student_nickname: randomItem(nicknames),
        student_gender: gender,
        student_birthday: new Date(`200${randomInt(2, 6)}-${randomInt(1, 12)}-${randomInt(1, 28)}`),
        student_phone_number: `08${randomInt(10000000, 99999999)}`,
        student_email: `student${i}@student.university.ac.th`,
        student_prefix: randomItem(["นาย", "นางสาว", "คุณ"]) as any,
      },
    });

    // เลือก dept แบบ realistic (ให้หลากหลาย)
    const dep = deptList[(i - 1) % deptList.length];
    const advisor = advisors.find((a) => a.department_id === dep.department_id) ?? randomItem(advisors);

    await prisma.studentAcademic.upsert({
      where: { student_id: student.student_id },
      update: {
        faculty_id: dep.faculty_id,
        department_id: dep.department_id,
        advisor_id: advisor?.advisor_id ?? null,
        student_program: randomBool(0.2) ? "International Program" : "Regular Program",
        student_degree: "Bachelor",
        student_degree_name: "Bachelor Degree",
        student_admit_academic_year: 2566,
      },
      create: {
        student_id: student.student_id,
        faculty_id: dep.faculty_id,
        department_id: dep.department_id,
        advisor_id: advisor?.advisor_id ?? null,
        student_program: randomBool(0.2) ? "International Program" : "Regular Program",
        student_degree: "Bachelor",
        student_degree_name: "Bachelor Degree",
        student_admit_academic_year: 2566,
      },
    });

    // addresses
    const addressDetail = `บ้านเลขที่ ${randomInt(1, 99)}/${randomInt(1, 99)} ถนนสายหลัก`;
    const postal = `${randomInt(10000, 99999)}`;

    const provCurrent = provinces[(i - 1) % provinces.length];
    const provHome = provinces[randomInt(0, provinces.length - 1)];

    await prisma.studentAddress.upsert({
      where: {
        student_id_student_address_type: {
          student_id: student.student_id,
          student_address_type: StudentAddressType.CURRENT,
        },
      },
      update: {
        province_id: provCurrent.province_id,
        student_address_detail: addressDetail,
        student_address_district: "Muang",
        student_address_sub_district: "Nai Muang",
        student_address_postal_code: postal,
      },
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.CURRENT,
        province_id: provCurrent.province_id,
        student_address_detail: addressDetail,
        student_address_district: "Muang",
        student_address_sub_district: "Nai Muang",
        student_address_postal_code: postal,
      },
    });

    await prisma.studentAddress.upsert({
      where: {
        student_id_student_address_type: {
          student_id: student.student_id,
          student_address_type: StudentAddressType.PERMANENT,
        },
      },
      update: {
        province_id: provHome.province_id,
        student_address_detail: `ภูมิลำเนา ${addressDetail}`,
        student_address_district: "Some District",
        student_address_sub_district: "Some Sub",
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      },
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.PERMANENT,
        province_id: provHome.province_id,
        student_address_detail: `ภูมิลำเนา ${addressDetail}`,
        student_address_district: "Some District",
        student_address_sub_district: "Some Sub",
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      },
    });

    students.push(student);
  }

  /* =========================================================
    5) TimeSlots + Bookings ecosystem
       - Booking เฉพาะ student10..student20
       - ครบทุก status
       - กัน unique (student_id, time_slot_id)
       - กัน capacity (max_capacity)
  ========================================================= */
  console.log("🗓️ Creating time slots ...");

  const today = startOfDay(new Date());
  const timeSlots: { id: number; status: TimeSlotStatus; maxCap: number }[] = [];

  // สร้าง slot จำนวนเยอะ ๆ กันชน
  for (let i = 0; i < 80; i++) {
    const base = new Date(today);
    base.setDate(base.getDate() + randomInt(-7, 21));
    base.setHours(randomInt(9, 16), 0, 0, 0);

    const start = new Date(base);
    const end = new Date(base);
    end.setHours(end.getHours() + 1);

    const maxCap = 3;
    const status = randomBool(0.7) ? TimeSlotStatus.AVAILABLE : TimeSlotStatus.BOOKED;

    const ts = await prisma.timeSlot.create({
      data: {
        time_slot_start_datetime: start,
        time_slot_end_datetime: end,
        time_slot_max_capacity: maxCap,
        time_slot_status: status,
      },
    });

    timeSlots.push({ id: ts.time_slot_id, status, maxCap });
  }

  async function pickSlotForStudentUnique(studentId: number, prefer?: TimeSlotStatus) {
    const candidates = prefer ? timeSlots.filter((s) => s.status === prefer) : timeSlots;

    for (let tries = 0; tries < 300; tries++) {
      const s = randomItem(candidates.length ? candidates : timeSlots);

      // capacity (นับ booking ที่ไม่ CANCELLED)
      const cnt = await prisma.booking.count({
        where: { time_slot_id: s.id, booking_status: { not: BookingStatus.CANCELLED } },
      });
      if (cnt >= s.maxCap) continue;

      // unique pair (student_id, time_slot_id)
      const dup = await prisma.booking.findFirst({
        where: { student_id: studentId, time_slot_id: s.id },
        select: { booking_id: true },
      });
      if (dup) continue;

      return s;
    }

    // หาไม่ได้จริง ๆ → สร้างใหม่
    const start = new Date(today);
    start.setDate(start.getDate() + randomInt(0, 7));
    start.setHours(randomInt(9, 16), 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    const ts = await prisma.timeSlot.create({
      data: {
        time_slot_start_datetime: start,
        time_slot_end_datetime: end,
        time_slot_max_capacity: 3,
        time_slot_status: TimeSlotStatus.AVAILABLE,
      },
    });

    const created = { id: ts.time_slot_id, status: TimeSlotStatus.AVAILABLE, maxCap: 3 };
    timeSlots.push(created);
    return created;
  }

  console.log("📌 Creating bookings for student10..student20 only ...");

  const bookingPlan: { status: BookingStatus; count: number }[] = [
    { status: BookingStatus.COMPLETED, count: 12 },
    { status: BookingStatus.IN_PROGRESS, count: 6 },
    { status: BookingStatus.PENDING_ASSIGNMENT, count: 10 },
    { status: BookingStatus.CANCELLED, count: 6 },
  ];

  const bookingStudents = students.slice(9); // student10..student20

  for (const plan of bookingPlan) {
    for (let i = 0; i < plan.count; i++) {
      const student = randomItem(bookingStudents);
      const category = randomItem(problemCategories);

      const prefer =
        plan.status === BookingStatus.PENDING_ASSIGNMENT ? TimeSlotStatus.AVAILABLE : TimeSlotStatus.BOOKED;

      const slot = await pickSlotForStudentUnique(student.student_id, prefer);

      const consultant =
        plan.status === BookingStatus.PENDING_ASSIGNMENT ? null : randomItem(consultants);

      // สร้าง booking ก่อน
      const booking = await prisma.booking.create({
        data: {
          student_id: student.student_id,
          consultant_id: consultant?.consultant_id ?? null,
          time_slot_id: slot.id,
          problem_category_id: category.problem_category_id,
          booking_detail_text: "ทดสอบการจอง (seed mock)",
          booking_status:
            plan.status === BookingStatus.CANCELLED
              ? BookingStatus.PENDING_ASSIGNMENT
              : plan.status,
        },
      });

      // CANCELLED -> สร้าง cancellation + update status
      if (plan.status === BookingStatus.CANCELLED) {
        await prisma.bookingCancellation.upsert({
          where: { booking_id: booking.booking_id },
          update: {
            booking_cancellation_reason: "ยกเลิกโดยระบบ (mock)",
            booking_cancellation_cancelled_by_id: headAccount.account_id,
            booking_cancellation_cancelled_at: new Date(),
          },
          create: {
            booking_id: booking.booking_id,
            booking_cancellation_reason: "ยกเลิกโดยระบบ (mock)",
            booking_cancellation_cancelled_by_id: headAccount.account_id,
            booking_cancellation_cancelled_at: new Date(),
          },
        });

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: { booking_status: BookingStatus.CANCELLED },
        });
      }

      // Assignment สำหรับ status ที่มี consultant
      if (consultant && consultants.length >= 2) {
        const assignedBy = randomItem(consultants);
        await prisma.bookingAssignment.create({
          data: {
            booking_id: booking.booking_id,
            booking_assignment_assigned_by_id: assignedBy.consultant_id,
            booking_assignment_assigned_to_id: consultant.consultant_id,
            booking_assignment_note: randomBool() ? "มอบหมายงานโดยระบบ (mock)" : null,
          },
        });
      }

      // Outcome + Feedback เฉพาะ COMPLETED
      if (plan.status === BookingStatus.COMPLETED) {
        await prisma.bookingOutcome.upsert({
          where: { booking_id: booking.booking_id },
          update: {
            booking_outcome_consultant_note: "ให้คำปรึกษาแล้ว นักศึกษาดีขึ้น (mock)",
            booking_outcome_next_step: randomBool() ? "ติดตามผลใน 2 สัปดาห์" : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
          create: {
            booking_id: booking.booking_id,
            booking_outcome_consultant_note: "ให้คำปรึกษาแล้ว นักศึกษาดีขึ้น (mock)",
            booking_outcome_next_step: randomBool() ? "ติดตามผลใน 2 สัปดาห์" : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
        });

        const consultantId = booking.consultant_id ?? randomItem(consultants).consultant_id;

        const feedback = await prisma.feedback.create({
          data: {
            booking_id: booking.booking_id,
            student_id: booking.student_id,
            consultant_id: consultantId,
            feedback_is_anonymous: randomBool(0.7),
          },
        });

        for (const cr of criteria) {
          await prisma.feedbackRating.upsert({
            where: {
              feedback_id_evaluation_criterion_id: {
                feedback_id: feedback.feedback_id,
                evaluation_criterion_id: cr.evaluation_criterion_id,
              },
            },
            update: { feedback_rating_score: randomInt(3, 5) },
            create: {
              feedback_id: feedback.feedback_id,
              evaluation_criterion_id: cr.evaluation_criterion_id,
              feedback_rating_score: randomInt(3, 5),
            },
          });
        }

        await prisma.feedbackComment.upsert({
          where: { feedback_id: feedback.feedback_id },
          update: {
            feedback_comment_text: randomBool()
              ? "รู้สึกดีขึ้นและได้รับคำแนะนำชัดเจน (mock)"
              : "อยากได้แนวทางปฏิบัติที่ละเอียดขึ้น (mock)",
            feedback_comment_admin_reply: randomBool(0.3)
              ? "ขอบคุณสำหรับความคิดเห็นครับ/ค่ะ (mock)"
              : null,
            feedback_comment_replied_by_id: randomBool(0.2) ? headAccount.account_id : null,
            feedback_comment_replied_at: randomBool(0.2) ? new Date() : null,
          },
          create: {
            feedback_id: feedback.feedback_id,
            feedback_comment_text: randomBool()
              ? "รู้สึกดีขึ้นและได้รับคำแนะนำชัดเจน (mock)"
              : "อยากได้แนวทางปฏิบัติที่ละเอียดขึ้น (mock)",
            feedback_comment_admin_reply: randomBool(0.3)
              ? "ขอบคุณสำหรับความคิดเห็นครับ/ค่ะ (mock)"
              : null,
            feedback_comment_replied_by_id: randomBool(0.2) ? headAccount.account_id : null,
            feedback_comment_replied_at: randomBool(0.2) ? new Date() : null,
          },
        });
      }

      // Notification
      const studentAcc = await prisma.student.findUnique({
        where: { student_id: booking.student_id },
        select: { account_id: true },
      });

      if (studentAcc && randomBool(0.5)) {
        await prisma.notification.create({
          data: {
            account_id: studentAcc.account_id,
            notification_template_id: randomBool()
              ? tplCreated.notification_template_id
              : tplAssigned.notification_template_id,
            booking_id: booking.booking_id,
            notification_channel: "LINE",
            notification_data: { bookingId: booking.booking_id, status: plan.status } as any,
            notification_status: randomBool(0.7) ? "SENT" : "PENDING",
            notification_sent_at: randomBool(0.7) ? new Date() : null,
          },
        });
      }
    }
  }

  /* =========================================================
    Done
  ========================================================= */
  console.log("✅ Seed completed!");
  console.log("🔐 Login accounts:");
  console.log(`- head / ${PLAIN_PASSWORD}`);
  console.log("- consultant1..consultant5 / same password");
  console.log("- student1..student20 / same password");
  console.log("");
  console.log("📌 Booking created only for: student10..student20");
  console.log("📌 student1..student9 have NO bookings (as requested)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
