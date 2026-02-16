// prisma/seeds/02-static.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { categoriesData } from "../seed-data/categories";
import { criteriaData } from "../seed-data/criteria";

export async function seedStatic(prisma: PrismaClient) {
  console.log("📋 Creating static data...");

  const plainPassword = "wellness@nu.ac.th_123456!";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // =========================
  // Student Status (rerun-safe)
  // =========================
  const statusActive = await prisma.studentStatus.upsert({
    where: { student_status_code: "ACTIVE" },
    create: {
      student_status_code: "ACTIVE",
      student_status_detail: "กำลังศึกษา",
    },
    update: {
      student_status_detail: "กำลังศึกษา",
    },
  });

  const statusInactive = await prisma.studentStatus.upsert({
    where: { student_status_code: "INACTIVE" },
    create: {
      student_status_code: "INACTIVE",
      student_status_detail: "พ้นสภาพ/พักการศึกษา",
    },
    update: {
      student_status_detail: "พ้นสภาพ/พักการศึกษา",
    },
  });

  // =========================
  // Organization (rerun-safe)
  // =========================
  const org = await prisma.organization.upsert({
    where: { organization_name: "Counseling Center" },
    create: {
      organization_name: "Counseling Center",
      organization_type: "Internal",
    },
    update: {
      organization_type: "Internal",
    },
  });

  // =========================
  // Problem Categories (rerun-safe)
  // =========================
  // ใช้ createMany + skipDuplicates เร็วและกันซ้ำ
  await prisma.problemCategory.createMany({
    data: categoriesData.map((c) => ({
      problem_category_code: c.code,
      problem_category_name_th: c.th,
      problem_category_name_en: c.en,
      problem_category_description: c.desc,
    })),
    skipDuplicates: true,
  });

  const problemCategories = await prisma.problemCategory.findMany({
    where: { problem_category_code: { in: categoriesData.map((c) => c.code) } },
    orderBy: { problem_category_code: "asc" },
  });

  // =========================
  // Evaluation Criteria (rerun-safe-ish)
  // =========================
  // NOTE: schema ไม่มี unique กันซ้ำ (ตามที่คุณส่งมา)
  // ถ้าคุณ clear ทุกครั้งก็โอเค แต่เพื่อกันรันซ้ำแบบไม่บวม
  // เราจะ upsert โดยใช้ "topic_th + display_order" เป็นตัวหา record เดิม (manual)
  // ถ้าอนาคตเพิ่ม unique ใน Prisma จะ clean กว่านี้
  const criteria: any[] = [];
  for (const c of criteriaData) {
    const existing = await prisma.evaluationCriterion.findFirst({
      where: {
        evaluation_criterion_topic_th: c.th,
        evaluation_criterion_display_order: c.order,
      },
    });

    if (existing) {
      const updated = await prisma.evaluationCriterion.update({
        where: { evaluation_criterion_id: existing.evaluation_criterion_id },
        data: {
          evaluation_criterion_topic_en: c.en,
          evaluation_criterion_weight: c.w as any,
        },
      });
      criteria.push(updated);
    } else {
      const created = await prisma.evaluationCriterion.create({
        data: {
          evaluation_criterion_topic_th: c.th,
          evaluation_criterion_topic_en: c.en,
          evaluation_criterion_weight: c.w as any,
          evaluation_criterion_display_order: c.order,
        },
      });
      criteria.push(created);
    }
  }

  // =========================
  // Online Channel Categories (rerun-safe)
  // =========================
  const onlineChannelsData = [
    { code: "LINE_CALL", name_th: "LINE Call", name_en: "LINE Call" },
    { code: "GOOGLE_MEET", name_th: "Google Meet", name_en: "Google Meet" },
    { code: "ZOOM", name_th: "Zoom", name_en: "Zoom" },
    { code: "MICROSOFT_TEAMS", name_th: "Microsoft Teams", name_en: "Microsoft Teams" },
    { code: "PHONE", name_th: "โทรศัพท์", name_en: "Phone" },
    { code: "OTHER", name_th: "อื่นๆ", name_en: "Other" },
  ];

  await prisma.onlineChannelCategory.createMany({
    data: onlineChannelsData.map((c) => ({
      online_channel_code: c.code,
      online_channel_name_th: c.name_th,
      online_channel_name_en: c.name_en,
      is_active: true,
    })),
    skipDuplicates: true,
  });
  
  const onlineChannels = await prisma.onlineChannelCategory.findMany();

  // =========================
  // Notification Templates (rerun-safe)
  // =========================
  const tplCreated = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: "BOOKING_CREATED" },
    create: {
      notification_template_code: "BOOKING_CREATED",
      notification_template_title: "สร้างการจองสำเร็จ",
      notification_template_body:
        "ระบบได้รับคำขอรับคำปรึกษาของคุณแล้ว โปรดรอการมอบหมายผู้ให้คำปรึกษา",
      notification_template_format: "TEXT",
    },
    update: {
      notification_template_title: "สร้างการจองสำเร็จ",
      notification_template_body:
        "ระบบได้รับคำขอรับคำปรึกษาของคุณแล้ว โปรดรอการมอบหมายผู้ให้คำปรึกษา",
      notification_template_format: "TEXT",
    },
  });

  const tplAssigned = await prisma.notificationTemplate.upsert({
    where: { notification_template_code: "BOOKING_ASSIGNED" },
    create: {
      notification_template_code: "BOOKING_ASSIGNED",
      notification_template_title: "มีการมอบหมายผู้ให้คำปรึกษา",
      notification_template_body: "ระบบได้มอบหมายผู้ให้คำปรึกษาให้กับการจองของคุณแล้ว",
      notification_template_format: "TEXT",
    },
    update: {
      notification_template_title: "มีการมอบหมายผู้ให้คำปรึกษา",
      notification_template_body: "ระบบได้มอบหมายผู้ให้คำปรึกษาให้กับการจองของคุณแล้ว",
      notification_template_format: "TEXT",
    },
  });

  // =========================
  // Point Rules (rerun-safe + ครบชุด)
  // =========================
  // ✅ เก็บ POINT_5 ไว้ (ตามที่คุณมีใน DB)
  // ✅ เพิ่ม rule มาตรฐานที่ bookings มักใช้
  const pointRulesData = [
    { code: "FEEDBACK_SUBMITTED", name_th: "ส่งแบบประเมิน", points: 5 },
  ] as const;

  for (const r of pointRulesData) {
    await prisma.pointRule.upsert({
      where: { point_rule_code: r.code },
      create: {
        point_rule_code: r.code,
        point_rule_name_th: r.name_th,
        point_rule_points: r.points,
        point_rule_is_active: true,
      },
      update: {
        point_rule_name_th: r.name_th,
        point_rule_points: r.points,
        point_rule_is_active: true,
      },
    });
  }

  const pointRule = await prisma.pointRule.findUnique({
    where: { point_rule_code: "FEEDBACK_SUBMITTED" },
  });

  // กัน null (แต่จริงๆ ไม่ควร)
  const safePointRule =
    pointRule ??
    (await prisma.pointRule.create({
      data: {
        point_rule_code: "FEEDBACK_SUBMITTED",
        point_rule_name_th: "ส่งแบบประเมิน",
        point_rule_points: 5,
        point_rule_is_active: true,
      },
    }));

  const pointAmount = Number(safePointRule.point_rule_points ?? 5);

  return {
    plainPassword,
    passwordHash,
    statusActive,
    statusInactive,
    org,
    problemCategories,
    criteria,
    tplCreated,
    tplAssigned,
    pointRules: {
      FEEDBACK_SUBMITTED: await prisma.pointRule.findUnique({ where: { point_rule_code: "FEEDBACK_SUBMITTED" } }),
    },
    pointAmount,
    onlineChannels,
  };
}
