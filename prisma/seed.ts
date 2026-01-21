// prisma/seed.ts
import {
  PrismaClient,
  AccountRole,
  BookingStatus,
  StudentGender,
  StudentAddressType,
  TimeSlotStatus,
  PointTxnType,
  UniversityAccessRole,
  RegionCode,
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
  "Somchai", "Somsak", "Malee", "Manee", "Pranee", "Wichai", "Suda", "Naree", "Arthit", "Kanya",
  "Decha", "Pichai", "Ratana", "Sunee", "Vipa", "Narong", "Siriporn", "Thongchai", "Udom", "Wanida",
  "Pongsak", "Nattapong", "Jirawat", "Chanida", "Phanumas", "Kritsada", "Pimchanok", "Nicha", "Thanawat", "Sirin",
];
const lastNames = [
  "Jaidee", "Meewong", "Rakchart", "Sukjai", "Munjai", "Kongthong", "Srisuk", "Wongsa", "Panya", "Kaewta",
  "Rojjana", "Saetang", "Saelee", "Jairak", "Boonmee", "Chaisri", "Wongsuwan", "Intara", "Promma", "Srithep",
  "Kongkaew", "Suwan", "Thongdee", "Rattanaporn", "Chantara", "Srisawat", "Petchmanee", "Phrom", "Kaewsai", "Yimyam",
];
const nicknames = ["Mod", "Kai", "Moo", "Nu", "Lek", "Yai", "Ton", "Som", "Oat", "Pim", "Nan", "May", "Best", "Keng", "Ploy", "Mew", "New", "Bam", "Mint", "Tee"];

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

  console.log("CLEAR_DB=1 -> clearing tables (DEV ONLY) ...");

  // children first
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

  // points
  await prisma.studentPointTransaction.deleteMany();
  await prisma.studentPointWallet.deleteMany();
  await prisma.pointRule.deleteMany();

  // consultant related
  await prisma.consultantSpecialization.deleteMany();
  await prisma.consultantLanguage.deleteMany();
  await prisma.consultantProfile.deleteMany();
  await prisma.consultant.deleteMany();

  // student related
  await prisma.studentAddress.deleteMany();
  await prisma.studentAcademic.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.student.deleteMany();

  // university structure
  await prisma.advisor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faculty.deleteMany();

  // access table
  await prisma.accountUniversityAccess.deleteMany();

  // master / tenants
  await prisma.university.deleteMany();
  await prisma.province.deleteMany();
  await prisma.region.deleteMany();

  await prisma.problemCategory.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.studentStatus.deleteMany();

  await prisma.account.deleteMany();

  console.log("cleared.");
}

/* =========================================================
  Seed Data (Faculties + Departments)
  (ชื่อไทยในไฟล์เดิมมันเพี้ยน encoding เลยขอใช้ไทย/อังกฤษที่อ่านได้จริง)
========================================================= */
const FACULTIES = [
  { code: "ENG", th: "คณะวิศวกรรมศาสตร์", en: "Engineering" },
  { code: "SCI", th: "คณะวิทยาศาสตร์", en: "Science" },
  { code: "ICT", th: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", en: "Information & Communication Technology" },
  { code: "MED", th: "คณะแพทยศาสตร์", en: "Medicine" },
  { code: "NUR", th: "คณะพยาบาลศาสตร์", en: "Nursing" },
  { code: "PHA", th: "คณะเภสัชศาสตร์", en: "Pharmacy" },
  { code: "LAW", th: "คณะนิติศาสตร์", en: "Law" },
  { code: "BUS", th: "คณะบริหารธุรกิจ", en: "Business Administration" },
];

const DEPARTMENTS: Array<{ facultyCode: string; code: string; th: string; en: string }> = [
  // ENG
  { facultyCode: "ENG", code: "CPE", th: "วิศวกรรมคอมพิวเตอร์", en: "Computer Engineering" },
  { facultyCode: "ENG", code: "EE", th: "วิศวกรรมไฟฟ้า", en: "Electrical Engineering" },
  { facultyCode: "ENG", code: "ME", th: "วิศวกรรมเครื่องกล", en: "Mechanical Engineering" },

  // SCI
  { facultyCode: "SCI", code: "CS", th: "วิทยาการคอมพิวเตอร์", en: "Computer Science" },
  { facultyCode: "SCI", code: "MATH", th: "คณิตศาสตร์", en: "Mathematics" },
  { facultyCode: "SCI", code: "STAT", th: "สถิติ", en: "Statistics" },

  // ICT
  { facultyCode: "ICT", code: "IT", th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" },
  { facultyCode: "ICT", code: "SE", th: "วิศวกรรมซอฟต์แวร์", en: "Software Engineering" },
  { facultyCode: "ICT", code: "DS", th: "วิทยาการข้อมูล", en: "Data Science" },

  // MED / NUR / PHA
  { facultyCode: "MED", code: "MEDGEN", th: "แพทยศาสตร์", en: "Doctor of Medicine" },
  { facultyCode: "NUR", code: "NURGEN", th: "พยาบาลศาสตร์", en: "Nursing" },
  { facultyCode: "PHA", code: "PHARM", th: "เภสัชศาสตร์", en: "Pharmacy" },

  // LAW / BUS
  { facultyCode: "LAW", code: "LAWGEN", th: "นิติศาสตร์", en: "Law" },
  { facultyCode: "BUS", code: "ACC", th: "การบัญชี", en: "Accounting" },
  { facultyCode: "BUS", code: "MKT", th: "การตลาด", en: "Marketing" },
];

/* =========================================================
  Main
========================================================= */
async function main() {
  console.log("Starting FULL seed (PostgreSQL + multi-university schema) ...");
  await clearDbIfNeeded();

  /* =========================================================
    Password
  ========================================================= */
  const PLAIN_PASSWORD = "wellness@nu.ac.th_123456!";
  const PASSWORD_HASH = await bcrypt.hash(PLAIN_PASSWORD, 10);

  /* =========================================================
    1) Region / Province / University (tenant)
  ========================================================= */
  const regions = await Promise.all([
    prisma.region.upsert({
      where: { region_code: RegionCode.NORTH },
      update: { region_name_th: "ภาคเหนือ" },
      create: { region_code: RegionCode.NORTH, region_name_th: "ภาคเหนือ" },
    }),
    prisma.region.upsert({
      where: { region_code: RegionCode.CENTRAL },
      update: { region_name_th: "ภาคกลาง" },
      create: { region_code: RegionCode.CENTRAL, region_name_th: "ภาคกลาง" },
    }),
    prisma.region.upsert({
      where: { region_code: RegionCode.NORTHEAST },
      update: { region_name_th: "ภาคตะวันออกเฉียงเหนือ" },
      create: { region_code: RegionCode.NORTHEAST, region_name_th: "ภาคตะวันออกเฉียงเหนือ" },
    }),
    prisma.region.upsert({
      where: { region_code: RegionCode.SOUTH },
      update: { region_name_th: "ภาคใต้" },
      create: { region_code: RegionCode.SOUTH, region_name_th: "ภาคใต้" },
    }),
  ]);

  const regionNorth = regions.find((r) => r.region_code === RegionCode.NORTH)!;
  const regionCentral = regions.find((r) => r.region_code === RegionCode.CENTRAL)!;
  const regionNE = regions.find((r) => r.region_code === RegionCode.NORTHEAST)!;
  const regionSouth = regions.find((r) => r.region_code === RegionCode.SOUTH)!;

  const provincesData = [
    { code: "PHS", th: "พิษณุโลก", en: "Phitsanulok", region_id: regionNorth.region_id },
    { code: "BKK", th: "กรุงเทพมหานคร", en: "Bangkok", region_id: regionCentral.region_id },
    { code: "CMI", th: "เชียงใหม่", en: "Chiang Mai", region_id: regionNorth.region_id },
    { code: "KKN", th: "ขอนแก่น", en: "Khon Kaen", region_id: regionNE.region_id },
    { code: "NKI", th: "นครราชสีมา", en: "Nakhon Ratchasima", region_id: regionNE.region_id },
    { code: "SNI", th: "สงขลา", en: "Songkhla", region_id: regionSouth.region_id },
  ];

  const provinces = [];
  for (const p of provincesData) {
    provinces.push(
      await prisma.province.upsert({
        where: { province_code: p.code },
        update: {
          region_id: p.region_id,
          province_name_th: p.th,
          province_name_en: p.en,
        },
        create: {
          region_id: p.region_id,
          province_code: p.code,
          province_name_th: p.th,
          province_name_en: p.en,
        },
      })
    );
  }

  const phitsanulok = provinces.find((p) => p.province_code === "PHS")!;
  const bangkok = provinces.find((p) => p.province_code === "BKK")!;
  const khonkaen = provinces.find((p) => p.province_code === "KKN")!;

  // Create 3 universities (tenants)
  const universities = await Promise.all([
    prisma.university.upsert({
      where: { university_code: "NU" },
      update: {
        university_name_th: "มหาวิทยาลัยนเรศวร",
        university_name_en: "Naresuan University",
        province_id: phitsanulok.province_id,
        university_is_active: true,
      },
      create: {
        university_code: "NU",
        university_name_th: "มหาวิทยาลัยนเรศวร",
        university_name_en: "Naresuan University",
        province_id: phitsanulok.province_id,
      },
    }),
    prisma.university.upsert({
      where: { university_code: "CU" },
      update: {
        university_name_th: "จุฬาลงกรณ์มหาวิทยาลัย",
        university_name_en: "Chulalongkorn University",
        province_id: bangkok.province_id,
        university_is_active: true,
      },
      create: {
        university_code: "CU",
        university_name_th: "จุฬาลงกรณ์มหาวิทยาลัย",
        university_name_en: "Chulalongkorn University",
        province_id: bangkok.province_id,
      },
    }),
    prisma.university.upsert({
      where: { university_code: "KKU" },
      update: {
        university_name_th: "มหาวิทยาลัยขอนแก่น",
        university_name_en: "Khon Kaen University",
        province_id: khonkaen.province_id,
        university_is_active: true,
      },
      create: {
        university_code: "KKU",
        university_name_th: "มหาวิทยาลัยขอนแก่น",
        university_name_en: "Khon Kaen University",
        province_id: khonkaen.province_id,
      },
    }),
  ]);

  const uniNU = universities.find((u) => u.university_code === "NU")!;
  const uniCU = universities.find((u) => u.university_code === "CU")!;
  const uniKKU = universities.find((u) => u.university_code === "KKU")!;

  /* =========================================================
    2) Static tables: StudentStatus, Organization, ProblemCategory,
       EvaluationCriterion, NotificationTemplate, PointRule
  ========================================================= */

  const statusActive = await prisma.studentStatus.upsert({
    where: { student_status_code: "ACTIVE" },
    update: { student_status_detail: "กำลังศึกษา" },
    create: { student_status_code: "ACTIVE", student_status_detail: "กำลังศึกษา" },
  });

  const statusInactive = await prisma.studentStatus.upsert({
    where: { student_status_code: "INACTIVE" },
    update: { student_status_detail: "พ้นสภาพ/พักการศึกษา" },
    create: { student_status_code: "INACTIVE", student_status_detail: "พ้นสภาพ/พักการศึกษา" },
  });

  const org = await prisma.organization.upsert({
    where: { organization_name: "Counseling Center" },
    update: { organization_type: "Internal" },
    create: { organization_name: "Counseling Center", organization_type: "Internal" },
  });

  const categoriesData = [
    { code: "ACAD", th: "ปัญหาการเรียน", en: "Academic", desc: "เช่น เกรด/การปรับตัวด้านการเรียน" },
    { code: "STRESS", th: "ความเครียด", en: "Stress", desc: "เช่น ความเครียดจากการเรียน/งาน/ชีวิต" },
    { code: "REL", th: "ความสัมพันธ์", en: "Relationship", desc: "เช่น เพื่อน แฟน ครอบครัว" },
    { code: "ADJ", th: "การปรับตัว", en: "Adjustment", desc: "เช่น ปรับตัวเข้ามหาลัย/ย้ายที่อยู่" },
    { code: "FIN", th: "ปัญหาการเงิน", en: "Finance", desc: "เช่น ค่าใช้จ่าย/หนี้สิน" },
  ];

  const problemCategories = [];
  for (const c of categoriesData) {
    problemCategories.push(
      await prisma.problemCategory.upsert({
        where: { problem_category_code: c.code },
        update: {
          problem_category_name_th: c.th,
          problem_category_name_en: c.en,
          problem_category_description: c.desc,
        },
        create: {
          problem_category_code: c.code,
          problem_category_name_th: c.th,
          problem_category_name_en: c.en,
          problem_category_description: c.desc,
        },
      })
    );
  }

  const criteriaData = [
    { th: "ความพึงพอใจโดยรวม", en: "Overall satisfaction", w: "1.00", order: 1 },
    { th: "ความชัดเจนในการให้คำแนะนำ", en: "Clarity", w: "1.00", order: 2 },
    { th: "การรับฟังและเข้าใจปัญหา", en: "Listening", w: "1.00", order: 3 },
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

  const tplCreated = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: "BOOKING_CREATED" },
    update: {
      notification_template_title: "สร้างการจองสำเร็จ",
      notification_template_body: "ระบบได้รับคำขอรับคำปรึกษาของคุณแล้ว โปรดรอการมอบหมายผู้ให้คำปรึกษา",
      notification_template_format: "TEXT",
    },
    create: {
      notification_template_code: "BOOKING_CREATED",
      notification_template_title: "สร้างการจองสำเร็จ",
      notification_template_body: "ระบบได้รับคำขอรับคำปรึกษาของคุณแล้ว โปรดรอการมอบหมายผู้ให้คำปรึกษา",
      notification_template_format: "TEXT",
    },
  });

  const tplAssigned = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: "BOOKING_ASSIGNED" },
    update: {
      notification_template_title: "มีการมอบหมายผู้ให้คำปรึกษา",
      notification_template_body: "ระบบได้มอบหมายผู้ให้คำปรึกษาให้กับการจองของคุณแล้ว",
      notification_template_format: "TEXT",
    },
    create: {
      notification_template_code: "BOOKING_ASSIGNED",
      notification_template_title: "มีการมอบหมายผู้ให้คำปรึกษา",
      notification_template_body: "ระบบได้มอบหมายผู้ให้คำปรึกษาให้กับการจองของคุณแล้ว",
      notification_template_format: "TEXT",
    },
  });

  // PointRule
  const pointRulesData = [
    { code: "BOOKING_COMPLETED", name: "เข้ารับคำปรึกษาสำเร็จ", points: 10 },
    { code: "FEEDBACK_SUBMITTED", name: "ส่งแบบประเมิน", points: 5 },
    { code: "NO_SHOW_PENALTY", name: "ไม่มาตามนัด (หักแต้ม)", points: -10 },
  ];

  const pointRules = [];
  for (const r of pointRulesData) {
    pointRules.push(
      await prisma.pointRule.upsert({
        where: { point_rule_code: r.code },
        update: { point_rule_name_th: r.name, point_rule_points: r.points, point_rule_is_active: true },
        create: { point_rule_code: r.code, point_rule_name_th: r.name, point_rule_points: r.points },
      })
    );
  }

  /* =========================================================
    3) Faculties + Departments (ต้องผูก university_id)
    NOTE: unique เป็น composite -> where ต้องใช้ชื่อคีย์ที่ prisma generate
  ========================================================= */
  const facultyByUniAndCode = new Map<string, { faculty_id: number; university_id: number; faculty_code: string }>();

  for (const uni of universities) {
    for (const f of FACULTIES) {
      const created = await prisma.faculty.upsert({
        where: {
          university_id_faculty_code: {
            university_id: uni.university_id,
            faculty_code: f.code,
          },
        },
        update: {
          faculty_name_th: f.th,
          faculty_name_en: f.en,
        },
        create: {
          university_id: uni.university_id,
          faculty_code: f.code,
          faculty_name_th: f.th,
          faculty_name_en: f.en,
        },
      });

      facultyByUniAndCode.set(`${uni.university_id}:${f.code}`, created);
    }
  }

  const deptByUniAndCode = new Map<string, { department_id: number; department_code: string; faculty_id: number; university_id: number }>();

  for (const uni of universities) {
    for (const d of DEPARTMENTS) {
      const fac = facultyByUniAndCode.get(`${uni.university_id}:${d.facultyCode}`);
      if (!fac) continue;

      const created = await prisma.department.upsert({
        where: {
          university_id_department_code: {
            university_id: uni.university_id,
            department_code: d.code,
          },
        },
        update: {
          faculty_id: fac.faculty_id,
          department_name_th: d.th,
          department_name_en: d.en,
        },
        create: {
          university_id: uni.university_id,
          faculty_id: fac.faculty_id,
          department_code: d.code,
          department_name_th: d.th,
          department_name_en: d.en,
        },
      });

      deptByUniAndCode.set(`${uni.university_id}:${d.code}`, created);
    }
  }

  /* =========================================================
    4) Advisors (ผูก university_id + faculty_id + department_id)
  ========================================================= */
  const advisors: any[] = [];
  for (const uni of universities) {
    for (const d of DEPARTMENTS) {
      const fac = facultyByUniAndCode.get(`${uni.university_id}:${d.facultyCode}`);
      const dep = deptByUniAndCode.get(`${uni.university_id}:${d.code}`);
      if (!fac || !dep) continue;

      const email = `advisor_${uni.university_code.toLowerCase()}_${d.code.toLowerCase()}@university.ac.th`;

      const existing = await prisma.advisor.findFirst({
        where: { university_id: uni.university_id, advisor_email: email },
      });
      if (existing) {
        advisors.push(existing);
        continue;
      }

      const created = await prisma.advisor.create({
        data: {
          university_id: uni.university_id,
          faculty_id: fac.faculty_id,
          department_id: dep.department_id,
          advisor_academic_rank: randomItem(["Asst. Prof.", "Assoc. Prof.", "Lecturer"]),
          advisor_prefix: randomItem(["ดร.", "ผศ.ดร.", "อ."]) as any,
          advisor_first_name: randomItem(firstNames),
          advisor_last_name: randomItem(lastNames),
          advisor_email: email,
          advisor_phone_number: `0${randomInt(800000000, 899999999)}`,
          advisor_office_location: `Building ${randomItem(["A", "B", "C", "D"])}, Room ${randomInt(101, 499)}`,
        },
      });

      advisors.push(created);
    }
  }

  /* =========================================================
    5) Accounts: head admin (ผูก home university)
  ========================================================= */
  const headAccount = await prisma.account.upsert({
    where: { account_username: "head" },
    update: {
      account_role: AccountRole.HEAD_CONSULTANT,
      account_password: PASSWORD_HASH,
      account_home_university_id: uniNU.university_id,
    },
    create: {
      account_username: "head",
      account_password: PASSWORD_HASH,
      account_role: AccountRole.HEAD_CONSULTANT,
      account_home_university_id: uniNU.university_id,
      account_line_id: null,
    },
  });

  /* =========================================================
    6) Consultants (consultant1..consultant5) -> ต้องมี university_id
       แจก consultant ให้กระจายตามมหาลัย
  ========================================================= */
  const consultants: any[] = [];
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

  const consultantUniversities = [uniNU, uniNU, uniNU, uniCU, uniKKU]; // 5 คน (3 NU, 1 CU, 1 KKU)

  for (let i = 1; i <= 5; i++) {
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);
    const uni = consultantUniversities[i - 1];

    const acc = await prisma.account.upsert({
      where: { account_username: `consultant${i}` },
      update: {
        account_role: AccountRole.CONSULTANT,
        account_password: PASSWORD_HASH,
        account_home_university_id: uni.university_id,
      },
      create: {
        account_username: `consultant${i}`,
        account_password: PASSWORD_HASH,
        account_role: AccountRole.CONSULTANT,
        account_home_university_id: uni.university_id,
      },
    });

    let consultant = await prisma.consultant.findFirst({ where: { account_id: acc.account_id } });
    if (!consultant) {
      consultant = await prisma.consultant.create({
        data: {
          account_id: acc.account_id,
          university_id: uni.university_id,
          organization_id: org.organization_id,
        },
      });
    }

    await prisma.consultantProfile.upsert({
      where: { consultant_id: consultant.consultant_id },
      update: {
        consultant_first_name: fname,
        consultant_last_name: lname,
        consultant_nickname: randomItem(nicknames),
        consultant_email: `consultant${i}@${uni.university_code.toLowerCase()}.ac.th`,
        consultant_gender: "MALE",
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
      create: {
        consultant_id: consultant.consultant_id,
        consultant_first_name: fname,
        consultant_last_name: lname,
        consultant_nickname: randomItem(nicknames),
        consultant_email: `consultant${i}@${uni.university_code.toLowerCase()}.ac.th`,
        consultant_gender: "MALE",
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
    });

    // languages (unique composite)
    const langCount = randomInt(1, 2);
    const pickedLangCodes = Array.from(new Set(Array.from({ length: langCount }, () => randomItem(languagePool).code)));
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
    const pickedSpecs = Array.from(new Set(Array.from({ length: specCount }, () => randomItem(specializationPool))));
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
    7) Students (student1..student20) -> ต้องมี university_id
       แจกนักศึกษากระจายตามมหาลัย (NU เยอะหน่อย)
  ========================================================= */
  const students: any[] = [];
  const deptList = Array.from(deptByUniAndCode.values());

  const studentUniversities = [
    uniNU, uniNU, uniNU, uniNU, uniNU, uniNU, uniNU, uniNU, uniNU, uniNU,
    uniCU, uniCU, uniCU, uniCU, uniKKU, uniKKU, uniKKU, uniKKU, uniNU, uniNU,
  ];

  for (let i = 1; i <= 20; i++) {
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);
    const gender = randomItem(Object.values(StudentGender));
    const lineId = `U_MOCK_${1000000000 + i}`;
    const uni = studentUniversities[i - 1];

    const acc = await prisma.account.upsert({
      where: { account_username: `student${i}` },
      update: {
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
        account_password: PASSWORD_HASH,
        account_home_university_id: uni.university_id,
      },
      create: {
        account_username: `student${i}`,
        account_password: PASSWORD_HASH,
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
        account_home_university_id: uni.university_id,
      },
    });

    let student = await prisma.student.findFirst({ where: { account_id: acc.account_id } });
    if (!student) {
      student = await prisma.student.create({
        data: {
          account_id: acc.account_id,
          university_id: uni.university_id,
          student_status_id: i % 10 === 0 ? statusInactive.student_status_id : statusActive.student_status_id,
          student_code: `660${1000 + i}`, // unique ต่อมหาลัย (ok)
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
        student_email: `student${i}@${uni.university_code.toLowerCase()}.ac.th`,
        student_prefix: randomItem(["นาย", "นางสาว", "นาง"]) as any,
      },
      create: {
        student_id: student.student_id,
        student_first_name: fname,
        student_last_name: lname,
        student_nickname: randomItem(nicknames),
        student_gender: gender,
        student_birthday: new Date(`200${randomInt(2, 6)}-${randomInt(1, 12)}-${randomInt(1, 28)}`),
        student_phone_number: `08${randomInt(10000000, 99999999)}`,
        student_email: `student${i}@${uni.university_code.toLowerCase()}.ac.th`,
        student_prefix: randomItem(["นาย", "นางสาว", "นาง"]) as any,
      },
    });

    // เลือก dept ของ "มหาลัยเดียวกัน" ให้ realistic
    const uniDeptList = deptList.filter((d) => d.university_id === uni.university_id);
    const dep = uniDeptList[(i - 1) % uniDeptList.length];
    const advisor =
      advisors.find((a) => a.university_id === uni.university_id && a.department_id === dep.department_id) ??
      advisors.find((a) => a.university_id === uni.university_id) ??
      randomItem(advisors);

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
    const addressDetail = `เลขที่ ${randomInt(1, 99)}/${randomInt(1, 99)}`;
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
        student_address_district: "เมือง",
        student_address_sub_district: "ในเมือง",
        student_address_postal_code: postal,
      },
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.CURRENT,
        province_id: provCurrent.province_id,
        student_address_detail: addressDetail,
        student_address_district: "เมือง",
        student_address_sub_district: "ในเมือง",
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
        student_address_detail: `บ้าน ${addressDetail}`,
        student_address_district: "อำเภอ",
        student_address_sub_district: "ตำบล",
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      },
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.PERMANENT,
        province_id: provHome.province_id,
        student_address_detail: `บ้าน ${addressDetail}`,
        student_address_district: "อำเภอ",
        student_address_sub_district: "ตำบล",
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      },
    });

    // wallet (points)
    await prisma.studentPointWallet.upsert({
      where: { student_id: student.student_id },
      update: {},
      create: { student_id: student.student_id, student_point_balance: 0 },
    });

    students.push(student);
  }

  // Optional: ให้ head ยืมสิทธิ์ดู CU ด้วย (ตัวอย่าง AccountUniversityAccess)
  await prisma.accountUniversityAccess.upsert({
    where: {
      account_id_university_id: { account_id: headAccount.account_id, university_id: uniCU.university_id },
    },
    update: {
      access_role: UniversityAccessRole.ADMIN,
      access_granted_by_account_id: headAccount.account_id,
      access_revoked_at: null,
    },
    create: {
      account_id: headAccount.account_id,
      university_id: uniCU.university_id,
      access_role: UniversityAccessRole.ADMIN,
      access_granted_by_account_id: headAccount.account_id,
    },
  });

  /* =========================================================
  8) TimeSlots + Bookings ecosystem
  IMPORTANT:
  - Booking.time_slot_id UNIQUE => 1 slot ต่อ 1 booking เท่านั้น
  - ดังนั้น max_capacity ใช้ 1 และ "ห้าม reuse slot เดียวทำหลาย booking"
  ========================================================= */
  console.log("Creating time slots ...");

  const today = startOfDay(new Date());
  const timeSlots: { id: number; university_id: number; consultant_id: number; status: TimeSlotStatus }[] = [];

  // สร้าง slot แบบ deterministic กันชน unique (consultant_id + start + end)
  const DAY_COUNT = 14; // 2 สัปดาห์
  const HOURS = [9, 10, 13, 14]; // 4 slots/วัน (ปรับได้)
  const SLOT_DURATION_HOURS = 1;

  for (const c of consultants) {
    const cFull = await prisma.consultant.findUnique({
      where: { consultant_id: c.consultant_id },
      select: { consultant_id: true, university_id: true },
    });
    if (!cFull) continue;

    for (let d = 0; d < DAY_COUNT; d++) {
      for (const h of HOURS) {
        const start = new Date(today);
        start.setDate(start.getDate() + d); // ไล่วันไปเรื่อยๆ
        start.setHours(h, 0, 0, 0);

        const end = new Date(start);
        end.setHours(end.getHours() + SLOT_DURATION_HOURS);

        // กันซ้ำไว้เพิ่มอีกชั้น (เผื่อเคย seed มาแล้วตอน CLEAR_DB=0)
        const exists = await prisma.timeSlot.findFirst({
          where: {
            consultant_id: cFull.consultant_id,
            time_slot_start_datetime: start,
            time_slot_end_datetime: end,
          },
          select: { time_slot_id: true },
        });
        if (exists) continue;

        const ts = await prisma.timeSlot.create({
          data: {
            consultant_id: cFull.consultant_id,
            university_id: cFull.university_id,
            time_slot_start_datetime: start,
            time_slot_end_datetime: end,
            time_slot_max_capacity: 1,
            time_slot_status: TimeSlotStatus.AVAILABLE,
          },
        });

        timeSlots.push({
          id: ts.time_slot_id,
          university_id: cFull.university_id,
          consultant_id: cFull.consultant_id,
          status: ts.time_slot_status,
        });
      }
    }
  }

  // helper: เลือก slot ที่ยังไม่ถูกจอง (เพราะ unique)
  async function pickUnusedSlotForUniversity(universityId: number) {
    for (let tries = 0; tries < 500; tries++) {
      const candidates = timeSlots.filter((s) => s.university_id === universityId);
      const s = randomItem(candidates);

      const alreadyBooked = await prisma.booking.findFirst({
        where: { time_slot_id: s.id },
        select: { booking_id: true },
      });

      if (alreadyBooked) continue;
      return s;
    }

    // ถ้า slot เต็มจริง ๆ -> สร้างใหม่
    const fallbackConsultant = consultants.find(async (c) => {
      const x = await prisma.consultant.findUnique({
        where: { consultant_id: c.consultant_id },
        select: { university_id: true },
      });
      return x?.university_id === universityId;
    }) ?? randomItem(consultants);

    const cFull = await prisma.consultant.findUnique({
      where: { consultant_id: fallbackConsultant.consultant_id },
      select: { consultant_id: true, university_id: true },
    });
    if (!cFull) throw new Error("No consultant available");

    const start = new Date(today);
    start.setDate(start.getDate() + randomInt(0, 7));
    start.setHours(randomInt(9, 16), 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    const ts = await prisma.timeSlot.create({
      data: {
        consultant_id: cFull.consultant_id,
        university_id: cFull.university_id,
        time_slot_start_datetime: start,
        time_slot_end_datetime: end,
        time_slot_max_capacity: 1,
        time_slot_status: TimeSlotStatus.AVAILABLE,
      },
    });

    const created = {
      id: ts.time_slot_id,
      university_id: cFull.university_id,
      consultant_id: cFull.consultant_id,
      status: TimeSlotStatus.AVAILABLE,
    };
    timeSlots.push(created);
    return created;
  }

  console.log("Creating bookings for student10..student20 only ...");

  const bookingPlan: { status: BookingStatus; count: number }[] = [
    { status: BookingStatus.COMPLETED, count: 12 },
    { status: BookingStatus.IN_PROGRESS, count: 6 },
    { status: BookingStatus.PENDING_ASSIGNMENT, count: 10 },
    { status: BookingStatus.CANCELLED, count: 6 },
  ];

  const bookingStudents = students.slice(9); // student10..student20

  const ruleCompleted = pointRules.find((r) => r.point_rule_code === "BOOKING_COMPLETED")!;
  const ruleFeedback = pointRules.find((r) => r.point_rule_code === "FEEDBACK_SUBMITTED")!;
  const ruleNoShow = pointRules.find((r) => r.point_rule_code === "NO_SHOW_PENALTY")!;

  for (const plan of bookingPlan) {
    for (let i = 0; i < plan.count; i++) {
      const student = randomItem(bookingStudents);
      const category = randomItem(problemCategories);

      // slot ต้องเป็นมหาลัยเดียวกับ student.university_id
      const slot = await pickUnusedSlotForUniversity(student.university_id);

      // consultant: ถ้า pending_assignment => null
      // ถ้าไม่ pending => ใช้ consultant ที่ตรง university (กัน cross-tenant งง)
      let consultantId: number | null = null;
      if (plan.status !== BookingStatus.PENDING_ASSIGNMENT) {
        const uniConsultants = await prisma.consultant.findMany({
          where: { university_id: student.university_id },
          select: { consultant_id: true },
        });
        consultantId = (uniConsultants.length ? randomItem(uniConsultants) : randomItem(consultants)).consultant_id;
      }

      const booking = await prisma.booking.create({
        data: {
          university_id: student.university_id,
          student_id: student.student_id,
          consultant_id: consultantId,
          time_slot_id: slot.id,
          problem_category_id: category.problem_category_id,
          booking_detail_text: "รายละเอียดการขอรับคำปรึกษา (seed mock)",
          booking_status:
            plan.status === BookingStatus.CANCELLED
              ? BookingStatus.PENDING_ASSIGNMENT
              : plan.status,
        },
      });

      // อัปเดตสถานะ slot ให้สื่อว่ามีการใช้งาน (optional แต่ดี)
      await prisma.timeSlot.update({
        where: { time_slot_id: slot.id },
        data: {
          time_slot_status:
            plan.status === BookingStatus.CANCELLED ? TimeSlotStatus.CANCELLED : TimeSlotStatus.BOOKED,
        },
      });

      // CANCELLED -> cancellation + update booking_status + points (penalty)
      if (plan.status === BookingStatus.CANCELLED) {
        await prisma.bookingCancellation.upsert({
          where: { booking_id: booking.booking_id },
          update: {
            booking_cancellation_reason: "ยกเลิกนัดหมาย (mock)",
            booking_cancellation_cancelled_by_id: headAccount.account_id,
            booking_cancellation_cancelled_at: new Date(),
          },
          create: {
            booking_id: booking.booking_id,
            booking_cancellation_reason: "ยกเลิกนัดหมาย (mock)",
            booking_cancellation_cancelled_by_id: headAccount.account_id,
            booking_cancellation_cancelled_at: new Date(),
          },
        });

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: { booking_status: BookingStatus.CANCELLED },
        });

        // points penalty
        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: ruleNoShow.point_rule_id,
            student_point_txn_type: PointTxnType.ADJUST,
            student_point_amount: ruleNoShow.point_rule_points,
            student_point_note: "หักแต้มจากการยกเลิก/ไม่มาตามนัด (mock)",
          },
        });

        await prisma.studentPointWallet.update({
          where: { student_id: booking.student_id },
          data: { student_point_balance: { increment: ruleNoShow.point_rule_points } },
        });
      }

      // Assignment (ถ้ามี consultant)
      if (consultantId) {
        const assignedBy = await prisma.consultant.findFirst({
          where: { university_id: student.university_id },
          select: { consultant_id: true },
        });

        if (assignedBy) {
          await prisma.bookingAssignment.create({
            data: {
              booking_id: booking.booking_id,
              booking_assignment_assigned_by_id: assignedBy.consultant_id,
              booking_assignment_assigned_to_id: consultantId,
              booking_assignment_note: randomBool() ? "มอบหมายเคส (mock)" : null,
            },
          });
        }
      }

      // Outcome + Feedback + Points (เฉพาะ COMPLETED)
      if (plan.status === BookingStatus.COMPLETED) {
        await prisma.bookingOutcome.upsert({
          where: { booking_id: booking.booking_id },
          update: {
            booking_outcome_consultant_note: "สรุปผลการให้คำปรึกษา (mock)",
            booking_outcome_next_step: randomBool() ? "นัดติดตามผลอีกครั้ง" : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
          create: {
            booking_id: booking.booking_id,
            booking_outcome_consultant_note: "สรุปผลการให้คำปรึกษา (mock)",
            booking_outcome_next_step: randomBool() ? "นัดติดตามผลอีกครั้ง" : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
        });

        const feedback = await prisma.feedback.create({
          data: {
            booking_id: booking.booking_id,
            student_id: booking.student_id,
            consultant_id: booking.consultant_id ?? consultantId ?? randomItem(consultants).consultant_id,
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
              ? "ให้คำปรึกษาดีมาก ช่วยได้เยอะ (mock)"
              : "อยากให้มีเวลามากกว่านี้ (mock)",
            feedback_comment_admin_reply: randomBool(0.3) ? "ขอบคุณสำหรับความคิดเห็น (mock)" : null,
            feedback_comment_replied_by_id: randomBool(0.2) ? headAccount.account_id : null,
            feedback_comment_replied_at: randomBool(0.2) ? new Date() : null,
          },
          create: {
            feedback_id: feedback.feedback_id,
            feedback_comment_text: randomBool()
              ? "ให้คำปรึกษาดีมาก ช่วยได้เยอะ (mock)"
              : "อยากให้มีเวลามากกว่านี้ (mock)",
            feedback_comment_admin_reply: randomBool(0.3) ? "ขอบคุณสำหรับความคิดเห็น (mock)" : null,
            feedback_comment_replied_by_id: randomBool(0.2) ? headAccount.account_id : null,
            feedback_comment_replied_at: randomBool(0.2) ? new Date() : null,
          },
        });

        // points earn: completed + feedback
        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: ruleCompleted.point_rule_id,
            student_point_txn_type: PointTxnType.EARN,
            student_point_amount: ruleCompleted.point_rule_points,
            student_point_note: "รับแต้มจากการเข้ารับคำปรึกษาสำเร็จ (mock)",
          },
        });

        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: ruleFeedback.point_rule_id,
            student_point_txn_type: PointTxnType.EARN,
            student_point_amount: ruleFeedback.point_rule_points,
            student_point_note: "รับแต้มจากการส่งแบบประเมิน (mock)",
          },
        });

        await prisma.studentPointWallet.update({
          where: { student_id: booking.student_id },
          data: { student_point_balance: { increment: ruleCompleted.point_rule_points + ruleFeedback.point_rule_points } },
        });
      }

      // Notification (ส่งไป account ของ student)
      const studentAcc = await prisma.student.findUnique({
        where: { student_id: booking.student_id },
        select: { account_id: true },
      });

      if (studentAcc && randomBool(0.6)) {
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
  console.log("Seed completed!");
  console.log("Login accounts:");
  console.log(`- head / ${PLAIN_PASSWORD}`);
  console.log("- consultant1..consultant5 / same password");
  console.log("- student1..student20 / same password");
  console.log("");
  console.log("Booking created only for: student10..student20");
  console.log("student1..student9 have NO bookings");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
