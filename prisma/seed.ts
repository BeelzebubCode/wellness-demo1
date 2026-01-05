// prisma/seed.ts
// ✅ Seed data matching the new schema

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Seed: StudentStatus (สถานะนิสิต)
  console.log('📌 Seeding Student Status...');
  const studentStatuses = [
    { code: 'ACTIVE', detail: 'กำลังศึกษาอยู่' },
    { code: 'GRADUATED', detail: 'สำเร็จการศึกษาแล้ว' },
    { code: 'RESIGNED', detail: 'ลาออก' },
    { code: 'SUSPENDED', detail: 'พักการศึกษา' },
  ];

  for (const status of studentStatuses) {
    await prisma.studentStatus.upsert({
      where: { student_status_code: status.code },
      update: {},
      create: {
        student_status_code: status.code,
        student_status_detail: status.detail,
      },
    });
  }

  // 2. Seed: ProblemCategory (ประเภทปัญหา)
  console.log('📌 Seeding Problem Categories...');
  const categories = [
    { code: 'ACADEMIC', th: 'ด้านการเรียน', en: 'Academic Issues', desc: 'ปัญหาเรื่องการเรียน ผลการศึกษา การสอบ' },
    { code: 'STRESS', th: 'ความเครียด/วิตกกังวล', en: 'Stress & Anxiety', desc: 'ความเครียดจากการเรียน การทำงาน หรือชีวิตประจำวัน' },
    { code: 'RELATIONSHIP', th: 'ความสัมพันธ์', en: 'Relationships', desc: 'ปัญหาครอบครัว เพื่อน คนรัก' },
    { code: 'CAREER', th: 'การวางแผนอาชีพ', en: 'Career Planning', desc: 'การหางาน ฝึกงาน วางแผนอนาคต' },
    { code: 'MENTAL_HEALTH', th: 'สุขภาพจิต', en: 'Mental Health', desc: 'ภาวะซึมเศร้า วิตกกังวล หรือปัญหาสุขภาพจิตอื่นๆ' },
    { code: 'OTHER', th: 'อื่นๆ', en: 'Other', desc: 'ปัญหาอื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น' },
  ];

  for (const cat of categories) {
    await prisma.problemCategory.upsert({
      where: { problem_category_code: cat.code },
      update: {},
      create: {
        problem_category_code: cat.code,
        problem_category_name_th: cat.th,
        problem_category_name_en: cat.en,
        problem_category_description: cat.desc,
      },
    });
  }

  // 3. Seed: Organization (หน่วยงานต้นสังกัด Consultant)
  console.log('📌 Seeding Organizations...');
  const orgs = [
    { name: 'Wellness Center', type: 'INTERNAL' },
    { name: 'กองกิจการนิสิต', type: 'INTERNAL' },
    { name: 'โรงพยาบาลมหาวิทยาลัย', type: 'INTERNAL' },
  ];

  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { organization_name: org.name },
      update: {},
      create: {
        organization_name: org.name,
        organization_type: org.type,
      },
    });
  }

  // 4. Seed: EvaluationCriterion (เกณฑ์การประเมิน)
  console.log('📌 Seeding Evaluation Criteria...');
  const criteria = [
    { th: 'ความเอาใจใส่และรับฟัง', en: 'Attentiveness & Listening', order: 1 },
    { th: 'ความเข้าใจปัญหา', en: 'Problem Understanding', order: 2 },
    { th: 'คำแนะนำที่ได้รับ', en: 'Advice Quality', order: 3 },
    { th: 'ความสะดวกในการนัดหมาย', en: 'Booking Convenience', order: 4 },
    { th: 'ความพึงพอใจโดยรวม', en: 'Overall Satisfaction', order: 5 },
  ];

  for (const c of criteria) {
    await prisma.evaluationCriterion.upsert({
      where: { evaluation_criterion_id: c.order },
      update: {},
      create: {
        evaluation_criterion_topic_th: c.th,
        evaluation_criterion_topic_en: c.en,
        evaluation_criterion_display_order: c.order,
        evaluation_criterion_weight: 1.0,
      },
    });
  }

  // 5. Seed: NotificationTemplate (แม่แบบข้อความ)
  console.log('📌 Seeding Notification Templates...');
  const templates = [
    {
      code: 'BOOKING_CONFIRMED',
      title: 'ยืนยันการจอง',
      body: 'การจองของคุณได้รับการยืนยันแล้ว\n📅 วันที่: {{date}}\n🕐 เวลา: {{time}}',
    },
    {
      code: 'BOOKING_ASSIGNED',
      title: 'ได้รับมอบหมายผู้ให้คำปรึกษา',
      body: 'คุณได้รับมอบหมายผู้ให้คำปรึกษาแล้ว\n👨‍⚕️ ผู้ให้คำปรึกษา: {{consultantName}}',
    },
    {
      code: 'BOOKING_REMINDER',
      title: 'เตือนนัดหมาย',
      body: 'อย่าลืมนัดหมายของคุณพรุ่งนี้\n📅 วันที่: {{date}}\n🕐 เวลา: {{time}}',
    },
    {
      code: 'BOOKING_CANCELLED',
      title: 'ยกเลิกการจอง',
      body: 'การจองของคุณถูกยกเลิกแล้ว\n📝 เหตุผล: {{reason}}',
    },
    {
      code: 'BOOKING_COMPLETED',
      title: 'เสร็จสิ้นการให้คำปรึกษา',
      body: 'ขอบคุณที่ใช้บริการ\n\nกรุณาให้คะแนนความพึงพอใจ: {{feedbackUrl}}',
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { notification_template_code: t.code },
      update: {},
      create: {
        notification_template_code: t.code,
        notification_template_title: t.title,
        notification_template_body: t.body,
        notification_template_format: 'TEXT',
      },
    });
  }

  // 6. Seed: Demo Admin Account (HEAD_CONSULTANT)
  console.log('📌 Seeding Demo Admin Account...');

  const wellnessOrg = await prisma.organization.findUnique({
    where: { organization_name: 'Wellness Center' },
  });

  if (wellnessOrg) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin account exists
    const existingAdmin = await prisma.account.findUnique({
      where: { account_username: 'admin' },
    });

    if (!existingAdmin) {
      // Create admin account
      const adminAccount = await prisma.account.create({
        data: {
          account_username: 'admin',
          account_password: hashedPassword,
          account_role: 'HEAD_CONSULTANT',
        },
      });

      // Create consultant
      const adminConsultant = await prisma.consultant.create({
        data: {
          account_id: adminAccount.account_id,
          organization_id: wellnessOrg.organization_id,
        },
      });

      // Create consultant profile
      await prisma.consultantProfile.create({
        data: {
          consultant_id: adminConsultant.consultant_id,
          consultant_first_name: 'ผู้ดูแล',
          consultant_last_name: 'ระบบ',
          consultant_nickname: 'Admin',
          consultant_email: 'admin@wellness.nu.ac.th',
        },
      });

      console.log('✅ Created admin account: admin / admin123');
    } else {
      console.log('ℹ️ Admin account already exists');
    }
  }

  console.log('✅ Seeding finished successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
