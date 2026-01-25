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

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomBool = (p = 0.5) => Math.random() < p;

const firstNames = [
  "Somchai",
  "Somsak",
  "Malee",
  "Manee",
  "Pranee",
  "Wichai",
  "Suda",
  "Naree",
  "Arthit",
  "Kanya",
  "Decha",
  "Pichai",
  "Ratana",
  "Sunee",
  "Vipa",
  "Narong",
  "Siriporn",
  "Thongchai",
  "Udom",
  "Wanida",
  "Pongsak",
  "Nattapong",
  "Jirawat",
  "Chanida",
  "Phanumas",
  "Kritsada",
  "Pimchanok",
  "Nicha",
  "Thanawat",
  "Sirin",
];
const lastNames = [
  "Jaidee",
  "Meewong",
  "Rakchart",
  "Sukjai",
  "Munjai",
  "Kongthong",
  "Srisuk",
  "Wongsa",
  "Panya",
  "Kaewta",
  "Rojjana",
  "Saetang",
  "Saelee",
  "Jairak",
  "Boonmee",
  "Chaisri",
  "Wongsuwan",
  "Intara",
  "Promma",
  "Srithep",
  "Kongkaew",
  "Suwan",
  "Thongdee",
  "Rattanaporn",
  "Chantara",
  "Srisawat",
  "Petchmanee",
  "Phrom",
  "Kaewsai",
  "Yimyam",
];
const nicknames = [
  "Mod",
  "Kai",
  "Moo",
  "Nu",
  "Lek",
  "Yai",
  "Ton",
  "Som",
  "Oat",
  "Pim",
  "Nan",
  "May",
  "Best",
  "Keng",
  "Ploy",
  "Mew",
  "New",
  "Bam",
  "Mint",
  "Tee",
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/* =========================================================
  Clear DB - ALWAYS CLEAR
========================================================= */
async function clearDatabase() {
  console.log("🗑️  Clearing all database tables...");

  // Delete in correct order (children first)
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

  await prisma.studentPointTransaction.deleteMany();
  await prisma.studentPointWallet.deleteMany();
  await prisma.pointRule.deleteMany();

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

  await prisma.accountUniversityAccess.deleteMany();

  await prisma.university.deleteMany();
  await prisma.province.deleteMany();
  await prisma.region.deleteMany();

  await prisma.problemCategory.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.studentStatus.deleteMany();

  await prisma.account.deleteMany();

  // Reset sequences (PostgreSQL specific)
  console.log("🔄 Resetting ID sequences...");

  const tables = [
    "account",
    "region",
    "province",
    "university",
    "student_status",
    "organization",
    "problem_category",
    "faculty",
    "department",
    "advisor",
    "student",
    "student_profile",
    "student_academic",
    "student_address",
    "consultant",
    "consultant_profile",
    "consultant_language",
    "consultant_specialization",
    "point_rule",
    "student_point_wallet",
    "student_point_transaction",
    "time_slot",
    "booking",
    "booking_assignment",
    "booking_outcome",
    "booking_cancellation",
    "evaluation_criterion",
    "feedback",
    "feedback_rating",
    "feedback_comment",
    "notification_template",
    "notification",
    "account_university_access",
  ];

  for (const table of tables) {
    try {
      // Find primary key column name
      const result = await prisma.$queryRawUnsafe<
        Array<{ column_name: string }>
      >(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = '${table}' 
         AND column_default LIKE 'nextval%'
         LIMIT 1`,
      );

      if (result.length > 0) {
        const pkColumn = result[0].column_name;
        const sequenceName = `${table}_${pkColumn}_seq`;
        await prisma.$executeRawUnsafe(
          `ALTER SEQUENCE ${sequenceName} RESTART WITH 1`,
        );
      }
    } catch (error) {
      // Ignore errors for tables without sequences
    }
  }

  console.log("✅ Database cleared and sequences reset!\n");
}

/* =========================================================
  Seed Data (Faculties + Departments)
========================================================= */
const FACULTIES = [
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
];

const DEPARTMENTS: Array<{
  facultyCode: string;
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

/* =========================================================
  Main
========================================================= */
async function main() {
  console.log("🚀 Starting database seeding...\n");

  // Always clear database
  await clearDatabase();

  /* =========================================================
    Password
  ========================================================= */
  const PLAIN_PASSWORD = "wellness@nu.ac.th_123456!";
  const PASSWORD_HASH = await bcrypt.hash(PLAIN_PASSWORD, 10);

  /* =========================================================
    1) Region / Province / University (3 universities only)
  ========================================================= */
  console.log("📍 Creating regions and provinces...");

  const regionNorth = await prisma.region.create({
    data: { region_code: RegionCode.NORTH, region_name_th: "ภาคเหนือ" },
  });

  const regionCentral = await prisma.region.create({
    data: { region_code: RegionCode.CENTRAL, region_name_th: "ภาคกลาง" },
  });

  const regionNE = await prisma.region.create({
    data: {
      region_code: RegionCode.NORTHEAST,
      region_name_th: "ภาคตะวันออกเฉียงเหนือ",
    },
  });

  const phitsanulok = await prisma.province.create({
    data: {
      region_id: regionNorth.region_id,
      province_code: "PHS",
      province_name_th: "พิษณุโลก",
      province_name_en: "Phitsanulok",
    },
  });

  const bangkok = await prisma.province.create({
    data: {
      region_id: regionCentral.region_id,
      province_code: "BKK",
      province_name_th: "กรุงเทพมหานคร",
      province_name_en: "Bangkok",
    },
  });

  const khonkaen = await prisma.province.create({
    data: {
      region_id: regionNE.region_id,
      province_code: "KKN",
      province_name_th: "ขอนแก่น",
      province_name_en: "Khon Kaen",
    },
  });

  console.log("🏫 Creating universities...");

  const uniNU = await prisma.university.create({
    data: {
      university_code: "NU",
      university_name_th: "มหาวิทยาลัยนเรศวร",
      university_name_en: "Naresuan University",
      province_id: phitsanulok.province_id,
      university_is_active: true,
    },
  });

  const uniKKU = await prisma.university.create({
    data: {
      university_code: "KKU",
      university_name_th: "มหาวิทยาลัยขอนแก่น",
      university_name_en: "Khon Kaen University",
      province_id: khonkaen.province_id,
      university_is_active: true,
    },
  });

  const uniCU = await prisma.university.create({
    data: {
      university_code: "CU",
      university_name_th: "จุฬาลงกรณ์มหาวิทยาลัย",
      university_name_en: "Chulalongkorn University",
      province_id: bangkok.province_id,
      university_is_active: true,
    },
  });

  const universities = [uniNU, uniKKU, uniCU];

  /* =========================================================
    2) Static tables
  ========================================================= */
  console.log("📋 Creating static data...");

  const statusActive = await prisma.studentStatus.create({
    data: {
      student_status_code: "ACTIVE",
      student_status_detail: "กำลังศึกษา",
    },
  });

  const statusInactive = await prisma.studentStatus.create({
    data: {
      student_status_code: "INACTIVE",
      student_status_detail: "พ้นสภาพ/พักการศึกษา",
    },
  });

  const org = await prisma.organization.create({
    data: {
      organization_name: "Counseling Center",
      organization_type: "Internal",
    },
  });

  const categoriesData = [
    {
      code: "ACAD",
      th: "ปัญหาการเรียน",
      en: "Academic",
      desc: "เช่น เกรด/การปรับตัวด้านการเรียน",
    },
    {
      code: "STRESS",
      th: "ความเครียด",
      en: "Stress",
      desc: "เช่น ความเครียดจากการเรียน/งาน/ชีวิต",
    },
    {
      code: "REL",
      th: "ความสัมพันธ์",
      en: "Relationship",
      desc: "เช่น เพื่อน แฟน ครอบครัว",
    },
    {
      code: "ADJ",
      th: "การปรับตัว",
      en: "Adjustment",
      desc: "เช่น ปรับตัวเข้ามหาลัย/ย้ายที่อยู่",
    },
    {
      code: "FIN",
      th: "ปัญหาการเงิน",
      en: "Finance",
      desc: "เช่น ค่าใช้จ่าย/หนี้สิน",
    },
  ];

  const problemCategories = [];
  for (const c of categoriesData) {
    problemCategories.push(
      await prisma.problemCategory.create({
        data: {
          problem_category_code: c.code,
          problem_category_name_th: c.th,
          problem_category_name_en: c.en,
          problem_category_description: c.desc,
        },
      }),
    );
  }

  const criteriaData = [
    {
      th: "ความพึงพอใจโดยรวม",
      en: "Overall satisfaction",
      w: "1.00",
      order: 1,
    },
    { th: "ความชัดเจนในการให้คำแนะนำ", en: "Clarity", w: "1.00", order: 2 },
    { th: "การรับฟังและเข้าใจปัญหา", en: "Listening", w: "1.00", order: 3 },
    {
      th: "ความเป็นส่วนตัวและความไว้วางใจ",
      en: "Privacy & trust",
      w: "1.00",
      order: 4,
    },
  ];

  const criteria = [];
  for (const c of criteriaData) {
    criteria.push(
      await prisma.evaluationCriterion.create({
        data: {
          evaluation_criterion_topic_th: c.th,
          evaluation_criterion_topic_en: c.en,
          evaluation_criterion_weight: c.w as any,
          evaluation_criterion_display_order: c.order,
        },
      }),
    );
  }

  const tplCreated = await prisma.notificationTemplate.create({
    data: {
      notification_template_code: "BOOKING_CREATED",
      notification_template_title: "สร้างการจองสำเร็จ",
      notification_template_body:
        "ระบบได้รับคำขอรับคำปรึกษาของคุณแล้ว โปรดรอการมอบหมายผู้ให้คำปรึกษา",
      notification_template_format: "TEXT",
    },
  });

  const tplAssigned = await prisma.notificationTemplate.create({
    data: {
      notification_template_code: "BOOKING_ASSIGNED",
      notification_template_title: "มีการมอบหมายผู้ให้คำปรึกษา",
      notification_template_body:
        "ระบบได้มอบหมายผู้ให้คำปรึกษาให้กับการจองของคุณแล้ว",
      notification_template_format: "TEXT",
    },
  });

  const pointRulesData = [
    { code: "BOOKING_COMPLETED", name: "เข้ารับคำปรึกษาสำเร็จ", points: 10 },
    { code: "FEEDBACK_SUBMITTED", name: "ส่งแบบประเมิน", points: 5 },
    { code: "NO_SHOW_PENALTY", name: "ไม่มาตามนัด (หักแต้ม)", points: -10 },
  ];

  const pointRules = [];
  for (const r of pointRulesData) {
    pointRules.push(
      await prisma.pointRule.create({
        data: {
          point_rule_code: r.code,
          point_rule_name_th: r.name,
          point_rule_points: r.points,
          point_rule_is_active: true,
        },
      }),
    );
  }

  /* =========================================================
    3) Faculties + Departments
  ========================================================= */
  console.log("🏛️  Creating faculties and departments...");

  const facultyByUniAndCode = new Map<string, any>();
  const deptByUniAndCode = new Map<string, any>();

  for (const uni of universities) {
    for (const f of FACULTIES) {
      const created = await prisma.faculty.create({
        data: {
          university_id: uni.university_id,
          faculty_code: f.code,
          faculty_name_th: f.th,
          faculty_name_en: f.en,
        },
      });
      facultyByUniAndCode.set(`${uni.university_id}:${f.code}`, created);
    }
  }

  for (const uni of universities) {
    for (const d of DEPARTMENTS) {
      const fac = facultyByUniAndCode.get(
        `${uni.university_id}:${d.facultyCode}`,
      );
      if (!fac) continue;

      const created = await prisma.department.create({
        data: {
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
    4) Advisors
  ========================================================= */
  console.log("👨‍🏫 Creating advisors...");

  const advisors: any[] = [];
  for (const uni of universities) {
    for (const d of DEPARTMENTS) {
      const fac = facultyByUniAndCode.get(
        `${uni.university_id}:${d.facultyCode}`,
      );
      const dep = deptByUniAndCode.get(`${uni.university_id}:${d.code}`);
      if (!fac || !dep) continue;

      const created = await prisma.advisor.create({
        data: {
          university_id: uni.university_id,
          faculty_id: fac.faculty_id,
          department_id: dep.department_id,
          advisor_academic_rank: randomItem([
            "Asst. Prof.",
            "Assoc. Prof.",
            "Lecturer",
          ]),
          advisor_prefix: randomItem(["ดร.", "ผศ.ดร.", "อ."]) as any,
          advisor_first_name: randomItem(firstNames),
          advisor_last_name: randomItem(lastNames),
          advisor_email: `advisor_${uni.university_code.toLowerCase()}_${d.code.toLowerCase()}@university.ac.th`,
          advisor_phone_number: `0${randomInt(800000000, 899999999)}`,
          advisor_office_location: `Building ${randomItem(["A", "B", "C", "D"])}, Room ${randomInt(101, 499)}`,
        },
      });
      advisors.push(created);
    }
  }

  /* =========================================================
   5) Head Accounts (NU / KKU / CU) - RERUN SAFE
   - สร้าง head แยก 3 user เพราะ Consultant.account_id unique
========================================================= */
  console.log("👑 Upserting head accounts (NU/KKU/CU)...");

  const headsByUni: Record<string, { account: any; consultant: any }> = {};

  const targetHeadUnis = universities.filter((u) =>
    ["NU", "KKU", "CU"].includes(u.university_code),
  );

  for (const uni of targetHeadUnis) {
    const username = `head_${uni.university_code.toLowerCase()}`; // head_nu/head_kku/head_cu

    // ✅ account: upsert by unique username
    const headAccount = await prisma.account.upsert({
      where: { account_username: username },
      create: {
        account_username: username,
        account_password: PASSWORD_HASH,
        account_role: AccountRole.HEAD_CONSULTANT,
        account_home_university_id: uni.university_id,
      },
      update: {
        account_password: PASSWORD_HASH, // ถ้าอยากให้รันซ้ำแล้ว reset pass ด้วย
        account_role: AccountRole.HEAD_CONSULTANT,
        account_home_university_id: uni.university_id,
      },
    });

    // ✅ consultant: upsert by unique account_id
    const headConsultant = await prisma.consultant.upsert({
      where: { account_id: headAccount.account_id }, // account_id unique
      create: {
        account_id: headAccount.account_id,
        university_id: uni.university_id,
        organization_id: org.organization_id,
      },
      update: {
        university_id: uni.university_id,
        organization_id: org.organization_id,
      },
    });

    // ✅ profile: upsert by unique consultant_id (เป็น PK)
    await prisma.consultantProfile.upsert({
      where: { consultant_id: headConsultant.consultant_id },
      create: {
        consultant_id: headConsultant.consultant_id,
        consultant_first_name: "Head",
        consultant_last_name: uni.university_code,
        consultant_nickname: "Boss",
        consultant_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
        consultant_gender: randomItem(["MALE", "FEMALE"]),
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
      update: {
        consultant_first_name: "Head",
        consultant_last_name: uni.university_code,
        consultant_nickname: "Boss",
        consultant_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
      },
    });

    // ✅ languages/specs: createMany + skipDuplicates (เพราะมี @@unique)
    await prisma.consultantLanguage.createMany({
      data: [
        {
          consultant_id: headConsultant.consultant_id,
          consultant_language_code: "TH",
          consultant_language_fluency_level: "NATIVE",
        },
        {
          consultant_id: headConsultant.consultant_id,
          consultant_language_code: "EN",
          consultant_language_fluency_level: "GOOD",
        },
      ],
      skipDuplicates: true,
    });

    await prisma.consultantSpecialization.createMany({
      data: [
        {
          consultant_id: headConsultant.consultant_id,
          consultant_specialization_topic: "Academic Counseling",
        },
        {
          consultant_id: headConsultant.consultant_id,
          consultant_specialization_topic: "Stress Management",
        },
      ],
      skipDuplicates: true,
    });

    headsByUni[uni.university_code] = {
      account: headAccount,
      consultant: headConsultant,
    };

    console.log(`✅ Upserted ${username} for ${uni.university_code}`);
  }

  // =========================================================
  // MAP: university_id -> head account_id (ใช้ตอน booking/feedback)
  // =========================================================
  const headAccountIdByUniversityId = new Map<number, number>();

  for (const uniCode of Object.keys(headsByUni)) {
    const headAcc = headsByUni[uniCode]?.account;
    if (headAcc?.account_home_university_id && headAcc?.account_id) {
      headAccountIdByUniversityId.set(
        headAcc.account_home_university_id,
        headAcc.account_id,
      );
    }
  }

/* =========================================================
  5.05) Rector Accounts (NU/KKU/CU) - RERUN SAFE
========================================================= */
  console.log("🏛️ Upserting rector accounts (NU/KKU/CU)...");

  const rectorsByUni: Record<string, { account: any }> = {};

  const rectorTargets = universities.filter((u) =>
    ["NU", "KKU", "CU"].includes(u.university_code),
  );

  for (const uni of rectorTargets) {
    const username = `rector_${uni.university_code.toLowerCase()}`; // rector_nu/rector_kku/rector_cu

    const rectorAccount = await prisma.account.upsert({
      where: { account_username: username },
      create: {
        account_username: username,
        account_password: PASSWORD_HASH,
        account_role: AccountRole.RECTOR,
        account_home_university_id: uni.university_id,
      },
      update: {
        account_password: PASSWORD_HASH, // รันซ้ำแล้ว reset pass ได้
        account_role: AccountRole.RECTOR,
        account_home_university_id: uni.university_id,
      },
    });

    rectorsByUni[uni.university_code] = { account: rectorAccount };

    console.log(`✅ Upserted ${username} for ${uni.university_code}`);
  }

  /* =========================================================
  5.1) Super Admin Account
========================================================= */
  console.log("🛡️ Creating super admin account...");

  const superAccount = await prisma.account.create({
    data: {
      account_username: "superAdmin",
      account_password: PASSWORD_HASH,
      account_role: AccountRole.SUPER_ADMIN,

      // ✅ แนะนำให้เป็น null เพราะ super เป็น platform-level
      account_home_university_id: null,

      // ถ้าอยากมี line id ก็ใส่ได้ (ต้องไม่ซ้ำ)
      // account_line_id: "U_SUPER_ADMIN_MOCK",
    },
  });

  /* =========================================================
   6) Consultants (2 per university) - RERUN SAFE
========================================================= */
  console.log("💼 Upserting consultants...");

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

  for (const uni of universities) {
    for (let i = 0; i < 2; i++) {
      const uniCode = uni.university_code.toLowerCase();
      const username = `consultant_${uniCode}_${i + 1}`; // ✅ stable มาก รันซ้ำไม่พัง

      // account upsert
      const acc = await prisma.account.upsert({
        where: { account_username: username },
        create: {
          account_username: username,
          account_password: PASSWORD_HASH,
          account_role: AccountRole.CONSULTANT,
          account_home_university_id: uni.university_id,
        },
        update: {
          account_password: PASSWORD_HASH,
          account_role: AccountRole.CONSULTANT,
          account_home_university_id: uni.university_id,
        },
      });

      // consultant upsert by account_id unique
      const consultant = await prisma.consultant.upsert({
        where: { account_id: acc.account_id },
        create: {
          account_id: acc.account_id,
          university_id: uni.university_id,
          organization_id: org.organization_id,
        },
        update: {
          university_id: uni.university_id,
          organization_id: org.organization_id,
        },
      });

      // profile upsert
      // ถ้ารันซ้ำ: จะคงชื่อเดิมที่เคย random ไว้ไหม?
      // -> ถ้าอยาก "คงเดิม" ให้เลือก update แบบไม่แตะชื่อ
      // -> ถ้าอยาก "รีสุ่มทุกครั้ง" ก็ใช้ random ใน update ได้
      const fname = randomItem(firstNames);
      const lname = randomItem(lastNames);

      await prisma.consultantProfile.upsert({
        where: { consultant_id: consultant.consultant_id },
        create: {
          consultant_id: consultant.consultant_id,
          consultant_first_name: fname,
          consultant_last_name: lname,
          consultant_nickname: randomItem(nicknames),
          consultant_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
          consultant_gender: randomItem(["MALE", "FEMALE"]),
          consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
        },
        update: {
          // ✅ แนะนำ: update เฉพาะ field ที่อยากให้ refresh
          consultant_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
        },
      });

      // languages/specs — createMany skipDuplicates
      const langCount = randomInt(1, 2);
      const pickedLangCodes = Array.from(
        new Set(
          Array.from(
            { length: langCount },
            () => randomItem(languagePool).code,
          ),
        ),
      );

      await prisma.consultantLanguage.createMany({
        data: pickedLangCodes.map((code) => {
          const l = languagePool.find((x) => x.code === code)!;
          return {
            consultant_id: consultant.consultant_id,
            consultant_language_code: l.code,
            consultant_language_fluency_level: l.level,
          };
        }),
        skipDuplicates: true,
      });

      const specCount = randomInt(1, 2);
      const pickedSpecs = Array.from(
        new Set(
          Array.from({ length: specCount }, () =>
            randomItem(specializationPool),
          ),
        ),
      );

      await prisma.consultantSpecialization.createMany({
        data: pickedSpecs.map((s) => ({
          consultant_id: consultant.consultant_id,
          consultant_specialization_topic: s,
        })),
        skipDuplicates: true,
      });

      consultants.push(consultant);
    }
  }

  /* =========================================================
   7) Students (20 students distributed) - RERUN SAFE
========================================================= */
  console.log("🎓 Upserting students...");

  const students: any[] = [];
  const provinces = [phitsanulok, bangkok, khonkaen];
  const deptList = Array.from(deptByUniAndCode.values());

  for (let i = 1; i <= 20; i++) {
    const username = `student${i}`;
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);
    const gender = randomItem(Object.values(StudentGender));
    const lineId = `U_MOCK_${1000000000 + i}`;

    // Distribute students: NU(8), KKU(6), CU(6)
    const uni = i <= 8 ? uniNU : i <= 14 ? uniKKU : uniCU;

    // account upsert
    const acc = await prisma.account.upsert({
      where: { account_username: username },
      create: {
        account_username: username,
        account_password: PASSWORD_HASH,
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
        account_home_university_id: uni.university_id,
      },
      update: {
        account_password: PASSWORD_HASH,
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
        account_home_university_id: uni.university_id,
      },
    });

    // student upsert by account_id unique
    const student = await prisma.student.upsert({
      where: { account_id: acc.account_id },
      create: {
        account_id: acc.account_id,
        university_id: uni.university_id,
        student_status_id:
          i % 10 === 0
            ? statusInactive.student_status_id
            : statusActive.student_status_id,
        student_code: `660${1000 + i}`, // ระวัง @@unique([university_id, student_code]) -> stable อยู่แล้ว
      },
      update: {
        university_id: uni.university_id,
        student_status_id:
          i % 10 === 0
            ? statusInactive.student_status_id
            : statusActive.student_status_id,
        student_code: `660${1000 + i}`,
      },
    });

    // profile upsert
    await prisma.studentProfile.upsert({
      where: { student_id: student.student_id },
      create: {
        student_id: student.student_id,
        student_first_name: fname,
        student_last_name: lname,
        student_nickname: randomItem(nicknames),
        student_gender: gender,
        student_birthday: new Date(
          `200${randomInt(2, 6)}-${randomInt(1, 12)}-${randomInt(1, 28)}`,
        ),
        student_phone_number: `08${randomInt(10000000, 99999999)}`,
        student_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
        student_prefix: randomItem(["นาย", "นางสาว", "นาง"]) as any,
      },
      update: {
        // แนะนำ update แค่ email/phone พอ (กันข้อมูลเปลี่ยนทุกครั้ง)
        student_email: `${username}@${uni.university_code.toLowerCase()}.ac.th`,
      },
    });

    // academic upsert
    const uniDeptList = deptList.filter(
      (d) => d.university_id === uni.university_id,
    );
    const dep = uniDeptList[(i - 1) % uniDeptList.length];
    const advisor = advisors.find(
      (a) =>
        a.university_id === uni.university_id &&
        a.department_id === dep.department_id,
    );

    await prisma.studentAcademic.upsert({
      where: { student_id: student.student_id },
      create: {
        student_id: student.student_id,
        faculty_id: dep.faculty_id,
        department_id: dep.department_id,
        advisor_id: advisor?.advisor_id ?? null,
        student_program: randomBool(0.2)
          ? "International Program"
          : "Regular Program",
        student_degree: "Bachelor",
        student_degree_name: "Bachelor Degree",
        student_admit_academic_year: 2566,
      },
      update: {
        faculty_id: dep.faculty_id,
        department_id: dep.department_id,
        advisor_id: advisor?.advisor_id ?? null,
      },
    });

    // address upsert (ต้องใช้ composite unique)
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
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.CURRENT,
        province_id: provCurrent.province_id,
        student_address_detail: addressDetail,
        student_address_district: "เมือง",
        student_address_sub_district: "ในเมือง",
        student_address_postal_code: postal,
      },
      update: {
        province_id: provCurrent.province_id,
        student_address_detail: addressDetail,
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
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.PERMANENT,
        province_id: provHome.province_id,
        student_address_detail: `บ้าน ${addressDetail}`,
        student_address_district: "อำเภอ",
        student_address_sub_district: "ตำบล",
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      },
      update: {
        province_id: provHome.province_id,
        student_address_detail: `บ้าน ${addressDetail}`,
      },
    });

    // wallet upsert
    await prisma.studentPointWallet.upsert({
      where: { student_id: student.student_id },
      create: { student_id: student.student_id, student_point_balance: 0 },
      update: {}, // ไม่ต้องทำอะไร
    });

    students.push(student);
  }

  /* =========================================================
  8) TimeSlots - University Pool (คิวรวม)
  - จ-ศ 08:00-20:00
  - ส-อา 08:00-16:00
  - slotDuration = 60 นาที
========================================================= */
  console.log("⏰ Creating time slots (university pool)...");

  const today = startOfDay(new Date());
  const timeSlots: Map<number, any[]> = new Map(); // university_id -> slots[]

  const DAY_COUNT = 14;
  const SLOT_DURATION_MINUTES = 60;
  const DEFAULT_CAPACITY = 2;

  function isWeekend(date: Date) {
    const day = date.getDay(); // 0=Sun,6=Sat
    return day === 0 || day === 6;
  }

  function buildSlotsForDate(date: Date) {
    // จ-ศ 08-20, ส-อา 08-16
    const openHour = 8;
    const closeHour = isWeekend(date) ? 16 : 20;

    const slots: Array<{ start: Date; end: Date }> = [];

    // ทำ slot ชั่วโมงต่อชั่วโมง: [08-09], [09-10] ... จนถึง closeHour
    for (let hour = openHour; hour < closeHour; hour++) {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES);

      slots.push({ start, end });
    }

    return slots;
  }

  for (const uni of universities) {
    const data: any[] = [];

    for (let day = 0; day < DAY_COUNT; day++) {
      const d = new Date(today);
      d.setDate(d.getDate() + day);
      d.setHours(0, 0, 0, 0);

      const slots = buildSlotsForDate(d);

      for (const s of slots) {
        data.push({
          university_id: uni.university_id,
          time_slot_start_datetime: s.start,
          time_slot_end_datetime: s.end,
          time_slot_max_capacity: DEFAULT_CAPACITY,
          time_slot_status: TimeSlotStatus.AVAILABLE,
        });
      }
    }

    // bulk insert (กันซ้ำด้วย unique [university_id, start, end])
    await prisma.timeSlot.createMany({
      data,
      skipDuplicates: true,
    });

    // ดึงกลับมาเก็บไว้ใช้ตอนทำ booking
    const slots = await prisma.timeSlot.findMany({
      where: {
        university_id: uni.university_id,
        time_slot_start_datetime: { gte: today },
      },
      orderBy: { time_slot_start_datetime: "asc" },
    });

    timeSlots.set(uni.university_id, slots);
  }

  /* =========================================================
    9) Bookings - Capacity aware (student10..student20)
  ========================================================= */
  console.log("📅 Creating bookings...");

  const bookingStudents = students.slice(9); // student10..student20
  const ruleCompleted = pointRules.find(
    (r) => r.point_rule_code === "BOOKING_COMPLETED",
  )!;
  const ruleFeedback = pointRules.find(
    (r) => r.point_rule_code === "FEEDBACK_SUBMITTED",
  )!;
  const ruleNoShow = pointRules.find(
    (r) => r.point_rule_code === "NO_SHOW_PENALTY",
  )!;

  const bookingPlan: { status: BookingStatus; count: number }[] = [
    { status: BookingStatus.COMPLETED, count: 12 },
    { status: BookingStatus.IN_PROGRESS, count: 6 },
    { status: BookingStatus.PENDING_ASSIGNMENT, count: 10 },
    { status: BookingStatus.CANCELLED, count: 6 },
  ];

  // track "active booking count" per slot id (ใช้เพื่อเลือก slot ที่ยังไม่เต็ม)
  const activeCountBySlotId = new Map<number, number>();

  function isActiveStatus(s: BookingStatus) {
    return (
      s === BookingStatus.PENDING_ASSIGNMENT ||
      s === BookingStatus.ASSIGNED ||
      s === BookingStatus.IN_PROGRESS
    );
  }

  function pickAvailableSlotForUniversity(uniId: number) {
    const slots = timeSlots.get(uniId) || [];
    // หา slot ที่ยังเหลือ capacity
    const candidates = slots.filter((s) => {
      const maxCap = Number(s.time_slot_max_capacity ?? 0);
      const used = activeCountBySlotId.get(s.time_slot_id) ?? 0;
      return maxCap > used && s.time_slot_status === TimeSlotStatus.AVAILABLE;
    });
    if (candidates.length === 0) return null;
    return randomItem(candidates);
  }

  for (const plan of bookingPlan) {
    for (let i = 0; i < plan.count; i++) {
      const student = randomItem(bookingStudents);
      const category = randomItem(problemCategories);

      const slot = pickAvailableSlotForUniversity(student.university_id);
      if (!slot) {
        console.log(
          `⚠️  No available slots (capacity full) for university ${student.university_id}`,
        );
        continue;
      }

      // consultantId: ถ้า pending ให้ null (ยังไม่แจกงาน)
      let consultantId: number | null = null;
      if (plan.status !== BookingStatus.PENDING_ASSIGNMENT) {
        const uniConsultants = consultants.filter(
          (c) => c.university_id === student.university_id,
        );
        consultantId = uniConsultants.length
          ? randomItem(uniConsultants).consultant_id
          : null;
      }

      // ถ้าจะสร้าง CANCELLED จริง ๆ ให้สร้าง cancellation record + update booking_status ตอนท้าย
      const initialStatus =
        plan.status === BookingStatus.CANCELLED
          ? BookingStatus.PENDING_ASSIGNMENT
          : plan.status;

      const booking = await prisma.booking.create({
        data: {
          university_id: student.university_id,
          student_id: student.student_id,
          consultant_id: consultantId,
          time_slot_id: slot.time_slot_id,
          problem_category_id: category.problem_category_id,
          booking_detail_text: `รายละเอียดการขอรับคำปรึกษา - ${category.problem_category_name_th}`,
          booking_status: initialStatus,
        },
      });

      // update active count map (นับเฉพาะ active statuses)
      if (isActiveStatus(initialStatus)) {
        activeCountBySlotId.set(
          slot.time_slot_id,
          (activeCountBySlotId.get(slot.time_slot_id) ?? 0) + 1,
        );
      }

      // Handle CANCELLED bookings
      if (plan.status === BookingStatus.CANCELLED) {
        await prisma.bookingCancellation.create({
          data: {
            booking_id: booking.booking_id,
            booking_cancellation_reason: "นักศึกษาไม่สามารถเข้ารับคำปรึกษาได้",
            booking_cancellation_cancelled_by_id: student.account_id,
            booking_cancellation_cancelled_at: new Date(),
          },
        });

        // เปลี่ยน booking เป็น CANCELLED
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: { booking_status: BookingStatus.CANCELLED },
        });

        // CANCELLED ไม่ถือว่า active -> ถ้าเมื่อกี้นับ active ไว้ต้องลดออก
        // (ตอนนี้ initialStatus เป็น PENDING_ASSIGNMENT ดังนั้นเคยเพิ่มไว้ ต้องลดออก)
        activeCountBySlotId.set(
          slot.time_slot_id,
          Math.max(0, (activeCountBySlotId.get(slot.time_slot_id) ?? 1) - 1),
        );

        // Penalty points
        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: ruleNoShow.point_rule_id,
            student_point_txn_type: PointTxnType.ADJUST,
            student_point_amount: ruleNoShow.point_rule_points,
            student_point_note: "หักแต้มจากการยกเลิกนัด",
          },
        });

        await prisma.studentPointWallet.update({
          where: { student_id: booking.student_id },
          data: {
            student_point_balance: { increment: ruleNoShow.point_rule_points },
          },
        });
      }

      // Assignment (ถ้ามี consultantId)
      if (consultantId) {
        const assignedBy = consultants.find(
          (c) => c.university_id === student.university_id,
        );
        if (assignedBy) {
          await prisma.bookingAssignment.create({
            data: {
              booking_id: booking.booking_id,
              booking_assignment_assigned_by_id: assignedBy.consultant_id,
              booking_assignment_assigned_to_id: consultantId,
              booking_assignment_note: "มอบหมายผู้ให้คำปรึกษา",
            },
          });
        }
      }

      // Handle COMPLETED bookings
      if (plan.status === BookingStatus.COMPLETED) {
        await prisma.bookingOutcome.create({
          data: {
            booking_id: booking.booking_id,
            booking_outcome_consultant_note: `สรุปผล: ${category.problem_category_name_th} - นักศึกษาได้รับคำแนะนำและมีแนวทางในการแก้ไขปัญหา`,
            booking_outcome_next_step: randomBool()
              ? "นัดติดตามผลใน 2 สัปดาห์"
              : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
        });

        const feedback = await prisma.feedback.create({
          data: {
            booking_id: booking.booking_id,
            student_id: booking.student_id,
            consultant_id: consultantId!, // completed ต้องมี consultant
            feedback_is_anonymous: randomBool(0.7),
          },
        });

        for (const cr of criteria) {
          await prisma.feedbackRating.create({
            data: {
              feedback_id: feedback.feedback_id,
              evaluation_criterion_id: cr.evaluation_criterion_id,
              feedback_rating_score: randomInt(4, 5),
            },
          });
        }

        const headAccountId =
          headAccountIdByUniversityId.get(booking.university_id) ?? null;

        await prisma.feedbackComment.create({
          data: {
            feedback_id: feedback.feedback_id,
            feedback_comment_text: randomItem([
              "ผู้ให้คำปรึกษาเข้าใจปัญหาและให้คำแนะนำที่เป็นประโยชน์มาก",
              "รู้สึกดีขึ้นหลังจากได้คุยและรับคำแนะนำ ขอบคุณครับ/ค่ะ",
              "อยากให้มีเวลามากกว่านี้ แต่โดยรวมดีมากครับ/ค่ะ",
            ]),
            feedback_comment_admin_reply: randomBool(0.3)
              ? "ขอบคุณสำหรับความคิดเห็น เรายินดีที่ได้ช่วยเหลือ"
              : null,

            // ✅ คนตอบ = head ของมหาลัยนั้น
            feedback_comment_replied_by_id: randomBool(0.3)
              ? headAccountId
              : null,
            feedback_comment_replied_at: randomBool(0.3) ? new Date() : null,
          },
        });

        // Reward points
        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: ruleCompleted.point_rule_id,
            student_point_txn_type: PointTxnType.EARN,
            student_point_amount: ruleCompleted.point_rule_points,
            student_point_note: "รับแต้มจากการเข้ารับคำปรึกษาสำเร็จ",
          },
        });

        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: ruleFeedback.point_rule_id,
            student_point_txn_type: PointTxnType.EARN,
            student_point_amount: ruleFeedback.point_rule_points,
            student_point_note: "รับแต้มจากการส่งแบบประเมิน",
          },
        });

        const totalPoints =
          ruleCompleted.point_rule_points + ruleFeedback.point_rule_points;
        await prisma.studentPointWallet.update({
          where: { student_id: booking.student_id },
          data: { student_point_balance: { increment: totalPoints } },
        });
      }

      // Notifications (เหมือนเดิม)
      const studentAcc = await prisma.student.findUnique({
        where: { student_id: booking.student_id },
        select: { account_id: true },
      });

      if (studentAcc && randomBool(0.7)) {
        await prisma.notification.create({
          data: {
            account_id: studentAcc.account_id,
            notification_template_id: randomBool()
              ? tplCreated.notification_template_id
              : tplAssigned.notification_template_id,
            booking_id: booking.booking_id,
            notification_channel: "LINE",
            notification_data: {
              bookingId: booking.booking_id,
              status: plan.status,
            } as any,
            notification_status: randomBool(0.8) ? "SENT" : "PENDING",
            notification_sent_at: randomBool(0.8) ? new Date() : null,
          },
        });
      }
    }
  }

  /* =========================================================
    Summary
  ========================================================= */
  console.log("\n✅ Database seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏫 Universities: ${universities.length} (NU, KKU, CU)`);
  console.log(`👑 Head Admin: 1 (username: head)`);
  console.log(`💼 Consultants: ${consultants.length} (2 per university)`);
  console.log(`🎓 Students: ${students.length} (8 NU, 6 KKU, 6 CU)`);
  console.log(`⏰ Time Slots: ${Array.from(timeSlots.values()).flat().length}`);
  console.log(
    `📅 Bookings: ${bookingPlan.reduce((sum, p) => sum + p.count, 0)}`,
  );
  console.log(
    `   - Completed: ${bookingPlan.find((p) => p.status === BookingStatus.COMPLETED)?.count || 0}`,
  );
  console.log(
    `   - In Progress: ${bookingPlan.find((p) => p.status === BookingStatus.IN_PROGRESS)?.count || 0}`,
  );
  console.log(
    `   - Pending: ${bookingPlan.find((p) => p.status === BookingStatus.PENDING_ASSIGNMENT)?.count || 0}`,
  );
  console.log(
    `   - Cancelled: ${bookingPlan.find((p) => p.status === BookingStatus.CANCELLED)?.count || 0}`,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔑 Login Credentials:");
  console.log(`   Username: head / consultant1-6 / student1-20`);
  console.log(`   Password: ${PLAIN_PASSWORD}`);
  console.log("\n💡 Note: Bookings created only for student10-20");
  console.log("   Students 1-9 have no bookings (clean slate for testing)\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
