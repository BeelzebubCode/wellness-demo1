import {
  PrismaClient,
  AccountRole,
  BookingStatus,
  StudentGender,
  StudentAddressType,
  TimeSlotStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// -----------------------------
// Helpers
// -----------------------------
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomBool = (p = 0.5) => Math.random() < p;

const firstNames = [
  'Somchai','Somsak','Malee','Manee','Pranee','Wichai','Suda','Naree','Arthit','Kanya',
  'Decha','Pichai','Ratana','Sunee','Vipa','Narong','Siriporn','Thongchai','Udom','Wanida',
];
const lastNames = [
  'Jaidee','Meewong','Rakchart','Sukjai','Munjai','Kongthong','Srisuk','Wongsa','Panya','Kaewta',
  'Rojjana','Saetang','Saelee','Jairak','Boonmee','Chaisri','Wongsuwan','Intara','Promma','Srithep',
];
const nicknames = ['Mod','Kai','Moo','Nu','Lek','Yai','Ton','Som','Oat','Pim','Nan','May','Best','Keng','Ploy'];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// -----------------------------
// Clear DB (DEV only)
// -----------------------------
async function clearDbIfNeeded() {
  const CLEAR = process.env.CLEAR_DB === '1';
  if (!CLEAR) return;

  console.log('🧨 CLEAR_DB=1 → clearing tables (DEV ONLY) ...');

  // ลบลูกก่อน (ระวัง FK)
  await prisma.notification.deleteMany();
  await prisma.notificationTemplate.deleteMany();

  await prisma.feedbackComment.deleteMany();
  await prisma.feedbackRating.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.evaluationCriterion.deleteMany();

  await prisma.bookingCancellation.deleteMany();
  await prisma.bookingOutcome.deleteMany();
  await prisma.bookingAssignment.deleteMany();
  await prisma.bookingSlot.deleteMany();
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

  console.log('✅ cleared.');
}

async function main() {
  console.log('🌱 Starting FULL seed (matches your schema.prisma) ...');

  await clearDbIfNeeded();

  // =========================================================
  // 1) Static tables
  // =========================================================

  // StudentStatus
  const statusActive = await prisma.studentStatus.upsert({
    where: { student_status_code: 'ACTIVE' },
    update: { student_status_detail: 'กำลังศึกษา' },
    create: { student_status_code: 'ACTIVE', student_status_detail: 'กำลังศึกษา' },
  });

  const statusInactive = await prisma.studentStatus.upsert({
    where: { student_status_code: 'INACTIVE' },
    update: { student_status_detail: 'พักการศึกษา/ลาออก' },
    create: { student_status_code: 'INACTIVE', student_status_detail: 'พักการศึกษา/ลาออก' },
  });

  // Organization
  const org = await prisma.organization.upsert({
    where: { organization_name: 'Counseling Center' },
    update: { organization_type: 'Internal' },
    create: { organization_name: 'Counseling Center', organization_type: 'Internal' },
  });

  // Province
  const provPHS = await prisma.province.upsert({
    where: { province_code: 'PHS' },
    update: { province_name_th: 'พิษณุโลก', province_name_en: 'Phitsanulok' },
    create: { province_code: 'PHS', province_name_th: 'พิษณุโลก', province_name_en: 'Phitsanulok' },
  });

  const provBKK = await prisma.province.upsert({
    where: { province_code: 'BKK' },
    update: { province_name_th: 'กรุงเทพมหานคร', province_name_en: 'Bangkok' },
    create: { province_code: 'BKK', province_name_th: 'กรุงเทพมหานคร', province_name_en: 'Bangkok' },
  });

  // Faculty
  const facultyENG = await prisma.faculty.upsert({
    where: { faculty_code: 'ENG' },
    update: { faculty_name_th: 'วิศวกรรมศาสตร์', faculty_name_en: 'Engineering' },
    create: { faculty_code: 'ENG', faculty_name_th: 'วิศวกรรมศาสตร์', faculty_name_en: 'Engineering' },
  });

  // Department
  const depCPE = await prisma.department.upsert({
    where: { department_code: 'CPE' },
    update: {
      faculty_id: facultyENG.faculty_id,
      department_name_th: 'วิศวกรรมคอมพิวเตอร์',
      department_name_en: 'Computer Engineering',
    },
    create: {
      faculty_id: facultyENG.faculty_id,
      department_code: 'CPE',
      department_name_th: 'วิศวกรรมคอมพิวเตอร์',
      department_name_en: 'Computer Engineering',
    },
  });

  const depME = await prisma.department.upsert({
    where: { department_code: 'ME' },
    update: {
      faculty_id: facultyENG.faculty_id,
      department_name_th: 'วิศวกรรมเครื่องกล',
      department_name_en: 'Mechanical Engineering',
    },
    create: {
      faculty_id: facultyENG.faculty_id,
      department_code: 'ME',
      department_name_th: 'วิศวกรรมเครื่องกล',
      department_name_en: 'Mechanical Engineering',
    },
  });

  // Advisor (ไม่มี unique บังคับใน schema → ทำแบบ find + create เพื่อไม่ซ้ำตาม email)
  async function upsertAdvisor(args: {
    faculty_id: number;
    department_id: number;
    first: string;
    last: string;
    email: string;
  }) {
    const existing = await prisma.advisor.findFirst({
      where: { advisor_email: args.email },
    });
    if (existing) return existing;

    return prisma.advisor.create({
      data: {
        faculty_id: args.faculty_id,
        department_id: args.department_id,
        advisor_first_name: args.first,
        advisor_last_name: args.last,
        advisor_email: args.email,
        advisor_academic_rank: 'Asst. Prof.',
        advisor_prefix: 'อ.',
        advisor_phone_number: `0${randomInt(800000000, 899999999)}`,
        advisor_office_location: 'Building A, Room 203',
      },
    });
  }

  const advisor1 = await upsertAdvisor({
    faculty_id: facultyENG.faculty_id,
    department_id: depCPE.department_id,
    first: 'Wuttipong',
    last: 'Rueanthong',
    email: 'advisor1@university.ac.th',
  });

  const advisor2 = await upsertAdvisor({
    faculty_id: facultyENG.faculty_id,
    department_id: depME.department_id,
    first: 'Janjira',
    last: 'Phayakphet',
    email: 'advisor2@university.ac.th',
  });

  // ProblemCategory
  const categoriesData = [
    { code: 'ACAD', th: 'การเรียน', desc: 'ปัญหาเรื่องเกรด, การเรียนไม่ทัน' },
    { code: 'STRESS', th: 'ความเครียด', desc: 'ความเครียดวิตกกังวลทั่วไป' },
    { code: 'REL', th: 'ความสัมพันธ์', desc: 'เพื่อน, แฟน, ครอบครัว' },
    { code: 'ADJ', th: 'การปรับตัว', desc: 'การปรับตัวเข้ากับมหาวิทยาลัย' },
    { code: 'FIN', th: 'การเงิน', desc: 'ทุนการศึกษา, ค่าใช้จ่าย' },
  ];

  const problemCategories = [];
  for (const c of categoriesData) {
    const pc = await prisma.problemCategory.upsert({
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
    });
    problemCategories.push(pc);
  }

  // EvaluationCriterion
  const criteriaData = [
    { th: 'ความพึงพอใจโดยรวม', en: 'Overall satisfaction', w: '1.00', order: 1 },
    { th: 'ความชัดเจนของคำแนะนำ', en: 'Clarity', w: '1.00', order: 2 },
    { th: 'ทักษะการรับฟัง', en: 'Listening', w: '1.00', order: 3 },
    { th: 'ความเป็นส่วนตัวและความไว้วางใจ', en: 'Privacy & trust', w: '1.00', order: 4 },
  ];

  const criteria = [];
  for (const c of criteriaData) {
    // ไม่มี unique ให้ upsert → ใช้ findFirst ตาม topic_th
    const existing = await prisma.evaluationCriterion.findFirst({
      where: { evaluation_criterion_topic_th: c.th },
    });
    if (existing) {
      criteria.push(existing);
      continue;
    }
    const created = await prisma.evaluationCriterion.create({
      data: {
        evaluation_criterion_topic_th: c.th,
        evaluation_criterion_topic_en: c.en,
        evaluation_criterion_weight: c.w as any, // prisma decimal รับ string ได้
        evaluation_criterion_display_order: c.order,
      },
    });
    criteria.push(created);
  }

  // NotificationTemplate
  const tplCreated = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: 'BOOKING_CREATED' },
    update: {
      notification_template_title: 'สร้างนัดหมายสำเร็จ',
      notification_template_body: 'ระบบได้รับคำขอจองของคุณแล้ว กรุณารอการมอบหมายที่ปรึกษา',
      notification_template_format: 'TEXT',
    },
    create: {
      notification_template_code: 'BOOKING_CREATED',
      notification_template_title: 'สร้างนัดหมายสำเร็จ',
      notification_template_body: 'ระบบได้รับคำขอจองของคุณแล้ว กรุณารอการมอบหมายที่ปรึกษา',
      notification_template_format: 'TEXT',
    },
  });

  const tplAssigned = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: 'BOOKING_ASSIGNED' },
    update: {
      notification_template_title: 'มอบหมายที่ปรึกษาแล้ว',
      notification_template_body: 'ระบบได้มอบหมายที่ปรึกษาให้คุณเรียบร้อยแล้ว',
      notification_template_format: 'TEXT',
    },
    create: {
      notification_template_code: 'BOOKING_ASSIGNED',
      notification_template_title: 'มอบหมายที่ปรึกษาแล้ว',
      notification_template_body: 'ระบบได้มอบหมายที่ปรึกษาให้คุณเรียบร้อยแล้ว',
      notification_template_format: 'TEXT',
    },
  });

  // =========================================================
  // 2) Accounts: head admin
  // =========================================================
  const headAccount = await prisma.account.upsert({
    where: { account_username: 'admin' },
    update: { account_role: AccountRole.HEAD_CONSULTANT },
    create: {
      account_username: 'admin',
      account_password: '$2b$10$mockhash_for_dev_only',
      account_role: AccountRole.HEAD_CONSULTANT,
      account_line_id: null,
    },
  });

  // =========================================================
  // 3) Consultants (4) + profile + language + specialization
  // =========================================================
  const consultants = [];

  const languagePool = [
    { code: 'TH', level: 'NATIVE' },
    { code: 'EN', level: 'GOOD' },
    { code: 'CN', level: 'BASIC' },
  ];
  const specializationPool = [
    'Stress Management',
    'Academic Counseling',
    'Relationship Counseling',
    'Financial Stress',
    'Adjustment to University',
  ];

  for (let i = 1; i <= 4; i++) {
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);

    const acc = await prisma.account.upsert({
      where: { account_username: `consultant${i}` },
      update: { account_role: AccountRole.CONSULTANT },
      create: {
        account_username: `consultant${i}`,
        account_password: '$2b$10$mockhash_for_dev_only',
        account_role: AccountRole.CONSULTANT,
      },
    });

    // consultant (ไม่มี unique field บังคับนอกจาก account_id) → ใช้ findFirst แล้ว create
    let consultant = await prisma.consultant.findFirst({
      where: { account_id: acc.account_id },
    });

    if (!consultant) {
      consultant = await prisma.consultant.create({
        data: {
          account_id: acc.account_id,
          organization_id: org.organization_id,
        },
      });
    }

    // profile 1:1 id=consultant_id
    await prisma.consultantProfile.upsert({
      where: { consultant_id: consultant.consultant_id },
      update: {
        consultant_first_name: fname,
        consultant_last_name: lname,
        consultant_nickname: randomItem(nicknames),
        consultant_email: `consultant${i}@university.ac.th`,
        consultant_gender: 'MALE',
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
      create: {
        consultant_id: consultant.consultant_id,
        consultant_first_name: fname,
        consultant_last_name: lname,
        consultant_nickname: randomItem(nicknames),
        consultant_email: `consultant${i}@university.ac.th`,
        consultant_gender: 'MALE',
        consultant_phone_number: `08${randomInt(10000000, 99999999)}`,
      },
    });

    // languages (unique composite: consultant_id + consultant_language_code)
    const langCount = randomInt(1, 2);
    const pickedLang = [...new Set(Array.from({ length: langCount }, () => randomItem(languagePool)))];
    for (const l of pickedLang) {
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

    // specialization (unique composite: consultant_id + consultant_specialization_topic)
    const specCount = randomInt(1, 2);
    const pickedSpec = [...new Set(Array.from({ length: specCount }, () => randomItem(specializationPool)))];
    for (const s of pickedSpec) {
      await prisma.consultantSpecialization.upsert({
        where: {
          consultant_id_consultant_specialization_topic: {
            consultant_id: consultant.consultant_id,
            consultant_specialization_topic: s,
          },
        },
        update: {},
        create: {
          consultant_id: consultant.consultant_id,
          consultant_specialization_topic: s,
        },
      });
    }

    consultants.push(consultant);
  }

  // =========================================================
  // 4) Students (20) + profile + academic + addresses
  // =========================================================
  const students = [];

  for (let i = 1; i <= 20; i++) {
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);
    const gender = randomItem(Object.values(StudentGender));

    const lineId = `U_MOCK_${1000000000 + i}`;

    const acc = await prisma.account.upsert({
      where: { account_username: `student${i}` },
      update: { account_role: AccountRole.STUDENT, account_line_id: lineId },
      create: {
        account_username: `student${i}`,
        account_password: '$2b$10$mockhash_for_dev_only',
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
      },
    });

    // student (unique: account_id)
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

    // student_profile (1:1 id = student_id)
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
        student_prefix: randomItem(['นาย', 'นางสาว', 'คุณ']) as any,
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
        student_prefix: randomItem(['นาย', 'นางสาว', 'คุณ']) as any,
      },
    });

    // student_academic (1:1 id=student_id)
    await prisma.studentAcademic.upsert({
      where: { student_id: student.student_id },
      update: {
        faculty_id: facultyENG.faculty_id,
        department_id: i % 2 === 0 ? depCPE.department_id : depME.department_id,
        advisor_id: i % 2 === 0 ? advisor1.advisor_id : advisor2.advisor_id,
        student_program: 'International Program',
        student_degree: 'Bachelor',
        student_degree_name: 'Bachelor of Engineering',
        student_admit_academic_year: 2566,
      },
      create: {
        student_id: student.student_id,
        faculty_id: facultyENG.faculty_id,
        department_id: i % 2 === 0 ? depCPE.department_id : depME.department_id,
        advisor_id: i % 2 === 0 ? advisor1.advisor_id : advisor2.advisor_id,
        student_program: 'International Program',
        student_degree: 'Bachelor',
        student_degree_name: 'Bachelor of Engineering',
        student_admit_academic_year: 2566,
      },
    });

    // addresses (unique composite: student_id + student_address_type)
    const addressDetail = `บ้านเลขที่ ${randomInt(1, 99)}/${randomInt(1, 99)} ถนนสายหลัก`;
    const postal = `${randomInt(10000, 99999)}`;

    // CURRENT
    await prisma.studentAddress.upsert({
      where: {
        student_id_student_address_type: {
          student_id: student.student_id,
          student_address_type: StudentAddressType.CURRENT,
        },
      },
      update: {
        province_id: provPHS.province_id,
        student_address_detail: addressDetail,
        student_address_district: 'Muang',
        student_address_sub_district: 'Nai Muang',
        student_address_postal_code: postal,
      },
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.CURRENT,
        province_id: provPHS.province_id,
        student_address_detail: addressDetail,
        student_address_district: 'Muang',
        student_address_sub_district: 'Nai Muang',
        student_address_postal_code: postal,
      },
    });

    // PERMANENT
    await prisma.studentAddress.upsert({
      where: {
        student_id_student_address_type: {
          student_id: student.student_id,
          student_address_type: StudentAddressType.PERMANENT,
        },
      },
      update: {
        province_id: randomBool() ? provBKK.province_id : provPHS.province_id,
        student_address_detail: `ภูมิลำเนา ${addressDetail}`,
        student_address_district: 'Some District',
        student_address_sub_district: 'Some Sub',
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      },
      create: {
        student_id: student.student_id,
        student_address_type: StudentAddressType.PERMANENT,
        province_id: randomBool() ? provBKK.province_id : provPHS.province_id,
        student_address_detail: `ภูมิลำเนา ${addressDetail}`,
        student_address_district: 'Some District',
        student_address_sub_district: 'Some Sub',
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      },
    });

    students.push(student);
  }

  // =========================================================
  // 5) TimeSlots + Bookings + BookingSlot + Assignment + Outcome + Cancellation + Feedback + Ratings + Comment + Notifications
  // =========================================================
  console.log('🗓️ Creating bookings ecosystem ...');

  // สร้าง time slots (30 slots: past/now/future)
  const timeSlots: { id: number; status: TimeSlotStatus }[] = [];

  for (let i = 0; i < 30; i++) {
    const base = startOfDay(new Date());
    base.setDate(base.getDate() + randomInt(-14, 14));
    base.setHours(randomInt(9, 16), 0, 0, 0);

    const start = new Date(base);
    const end = new Date(base);
    end.setHours(end.getHours() + 1);

    const status = randomBool(0.6) ? TimeSlotStatus.BOOKED : TimeSlotStatus.AVAILABLE;

    const ts = await prisma.timeSlot.create({
      data: {
        time_slot_start_datetime: start,
        time_slot_end_datetime: end,
        time_slot_max_capacity: 1,
        time_slot_status: status,
      },
    });

    timeSlots.push({ id: ts.time_slot_id, status });
  }

  // สร้าง booking 50 รายการ
  const bookingTargets = [
    { count: 30, status: BookingStatus.COMPLETED },
    { count: 10, status: BookingStatus.IN_PROGRESS },
    { count: 10, status: BookingStatus.PENDING_ASSIGNMENT },
  ];

  const allBookings: number[] = [];

  for (const target of bookingTargets) {
    for (let i = 0; i < target.count; i++) {
      const student = randomItem(students);
      const category = randomItem(problemCategories);

      // time slot เลือกตาม status ที่อยากได้
      let slot = randomItem(timeSlots);
      if (target.status === BookingStatus.PENDING_ASSIGNMENT) {
        // เอา AVAILABLE เป็นหลัก
        const available = timeSlots.filter((s) => s.status === TimeSlotStatus.AVAILABLE);
        if (available.length) slot = randomItem(available);
      } else {
        // เอา BOOKED เป็นหลัก
        const booked = timeSlots.filter((s) => s.status === TimeSlotStatus.BOOKED);
        if (booked.length) slot = randomItem(booked);
      }

      // consultant สำหรับสถานะที่ไม่ pending
      const consultant =
        target.status === BookingStatus.PENDING_ASSIGNMENT ? null : randomItem(consultants);

      const booking = await prisma.booking.create({
        data: {
          student_id: student.student_id,
          consultant_id: consultant?.consultant_id ?? null,
          problem_category_id: category.problem_category_id,
          booking_detail_text: 'ทดสอบการจอง (seed mock)',
          booking_status: target.status,
        },
      });

      allBookings.push(booking.booking_id);

      // booking_slot (composite PK booking_id+time_slot_id)
      await prisma.bookingSlot.upsert({
        where: {
          booking_id_time_slot_id: {
            booking_id: booking.booking_id,
            time_slot_id: slot.id,
          },
        },
        update: {},
        create: {
          booking_id: booking.booking_id,
          time_slot_id: slot.id,
        },
      });

      // assignment (มี field assigned_by/assigned_to เป็น consultant_id ทั้งคู่)
      if (consultant && consultants.length >= 2) {
        const assignedBy = randomItem(consultants); // ผู้มอบหมาย (เป็น consultant ตาม schema)
        const assignedTo = consultant; // ผู้รับงาน

        await prisma.bookingAssignment.create({
          data: {
            booking_id: booking.booking_id,
            booking_assignment_assigned_by_id: assignedBy.consultant_id,
            booking_assignment_assigned_to_id: assignedTo.consultant_id,
            booking_assignment_note: randomBool() ? 'มอบหมายงานโดยระบบ (mock)' : null,
          },
        });
      }

      // outcome เฉพาะ COMPLETED
      if (target.status === BookingStatus.COMPLETED) {
        await prisma.bookingOutcome.upsert({
          where: { booking_id: booking.booking_id },
          update: {
            booking_outcome_consultant_note: 'ให้คำปรึกษาแล้ว นักศึกษาดีขึ้น (mock)',
            booking_outcome_next_step: randomBool() ? 'ติดตามผลใน 2 สัปดาห์' : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
          create: {
            booking_id: booking.booking_id,
            booking_outcome_consultant_note: 'ให้คำปรึกษาแล้ว นักศึกษาดีขึ้น (mock)',
            booking_outcome_next_step: randomBool() ? 'ติดตามผลใน 2 สัปดาห์' : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
        });

        // feedback (ต้องมี consultant_id not null ตาม schema)
        const consultantId = booking.consultant_id ?? randomItem(consultants).consultant_id;

        const feedback = await prisma.feedback.create({
          data: {
            booking_id: booking.booking_id,
            student_id: booking.student_id,
            consultant_id: consultantId,
            feedback_is_anonymous: randomBool(0.7),
          },
        });

        // feedback_ratings
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

        // feedback_comment (1:1 id = feedback_id)
        await prisma.feedbackComment.upsert({
          where: { feedback_id: feedback.feedback_id },
          update: {
            feedback_comment_text: randomBool()
              ? 'รู้สึกดีขึ้นและได้รับคำแนะนำชัดเจน (mock)'
              : 'อยากได้แนวทางปฏิบัติที่ละเอียดขึ้น (mock)',
            feedback_comment_admin_reply: randomBool(0.3) ? 'ขอบคุณสำหรับความคิดเห็นครับ/ค่ะ (mock)' : null,
            feedback_comment_replied_by_id: randomBool(0.2) ? headAccount.account_id : null,
            feedback_comment_replied_at: randomBool(0.2) ? new Date() : null,
          },
          create: {
            feedback_id: feedback.feedback_id,
            feedback_comment_text: randomBool()
              ? 'รู้สึกดีขึ้นและได้รับคำแนะนำชัดเจน (mock)'
              : 'อยากได้แนวทางปฏิบัติที่ละเอียดขึ้น (mock)',
            feedback_comment_admin_reply: randomBool(0.3) ? 'ขอบคุณสำหรับความคิดเห็นครับ/ค่ะ (mock)' : null,
            feedback_comment_replied_by_id: randomBool(0.2) ? headAccount.account_id : null,
            feedback_comment_replied_at: randomBool(0.2) ? new Date() : null,
          },
        });
      }

      // cancellation บางรายการ (เช่น บาง PENDING)
      if (target.status === BookingStatus.PENDING_ASSIGNMENT && randomBool(0.15)) {
        await prisma.bookingCancellation.upsert({
          where: { booking_id: booking.booking_id },
          update: {
            booking_cancellation_reason: 'ติดธุระกะทันหัน (mock)',
            booking_cancellation_cancelled_by_id: headAccount.account_id,
            booking_cancellation_cancelled_at: new Date(),
          },
          create: {
            booking_id: booking.booking_id,
            booking_cancellation_reason: 'ติดธุระกะทันหัน (mock)',
            booking_cancellation_cancelled_by_id: headAccount.account_id,
            booking_cancellation_cancelled_at: new Date(),
          },
        });

        // update booking_status เป็น CANCELLED
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: { booking_status: BookingStatus.CANCELLED },
        });
      }

      // notification (ผูกกับ account_id ของ student)
      const studentAcc = await prisma.student.findUnique({
        where: { student_id: booking.student_id },
        select: { account_id: true },
      });

      if (studentAcc && randomBool(0.4)) {
        await prisma.notification.create({
          data: {
            account_id: studentAcc.account_id,
            notification_template_id: randomBool() ? tplCreated.notification_template_id : tplAssigned.notification_template_id,
            booking_id: booking.booking_id,
            notification_channel: 'LINE',
            notification_data: { bookingId: booking.booking_id, status: booking.booking_status } as any,
            notification_status: randomBool(0.6) ? 'SENT' : 'PENDING',
            notification_sent_at: randomBool(0.6) ? new Date() : null,
          },
        });
      }
    }
  }

  console.log('✅ Seed completed!');
  console.log('📌 ตัวอย่าง mock lineUserId: U_MOCK_1000000001 (student1)');
  console.log('📌 ลองจองด้วย POST /api/v1/bookings payload:');
  console.log(JSON.stringify({
    lineUserId: 'U_MOCK_1000000001',
    timeSlotId: timeSlots.find(s => s.status === TimeSlotStatus.AVAILABLE)?.id ?? timeSlots[0].id,
    problemCategoryCode: 'STRESS',
    detailText: 'ทดสอบจองแบบ mock line',
  }, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
