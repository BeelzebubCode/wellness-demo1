// prisma/seeds/09-bookings.ts
import {
  PrismaClient,
  BookingStatus,
  TimeSlotStatus,
} from "@prisma/client";

import {
  randomBool,
  randomInt,
  randomItem,
  pickWeightedKey,
  clamp,
} from "../seed-utils/rand";

import {
  startOfDay,
  addDays,
  addHours,
  addMinutes,
  randomDateBetween,
} from "../seed-utils/date";

import { universityStudentCounts, DEFAULT_STUDENT_COUNT } from "../../src/lib/constants/university-student-counts";

import type { UniversityCode } from "../seed-data/universities";

type UniCode = UniversityCode;

export async function seedBookings(
  prisma: PrismaClient,
  args: {
    universities: any[];
    students: any[];
    consultants: any[];
    timeSlotsByUniId: Map<number, any[]>;
    problemCategories: any[];
    criteria: any[];
    headAccountIdByUniversityId: Map<number, number>;
    tplCreated: any;
    tplAssigned: any;
    pointRules: any;
    pointAmount: number;
    consultantBiasById: Map<number, number>;
    bookingPlan: { status: BookingStatus; count: number }[];

    // ✅ รองรับหลายมหาลัย: ส่งมาไม่ครบทุก code ได้
    cancelUniWeights?: Partial<Record<UniCode, number>>;
    onlineChannels: any[];
    cancellationReasons: any[];
  },
) {
  console.log("📅 Creating bookings...");

  const {
    universities,
    students,
    consultants,
    timeSlotsByUniId: rawTimeSlotsByUniId,
    problemCategories,
    criteria,
    headAccountIdByUniversityId,
    tplCreated,
    tplAssigned,
    pointRules,
    pointAmount,
    consultantBiasById,
    bookingPlan,
    cancelUniWeights,
    onlineChannels,
    cancellationReasons,
  } = args;

  // ... (existing code) ...

  // 1. Cancellations
  // logic: Cancelled bookings need a record.
  // reason: fixed reason from seeded data
  // cancelled_by: student
  // cancelled_at: ~1-48 hours before slot
  console.log("   📝 Generating Booking Cancellations (SQL)...");

  // Find a default reason (e.g., STUDENT_BUSY)
  const defaultReason = cancellationReasons.find(r => r.cancellation_reason_code === "STUDENT_BUSY") 
                     ?? cancellationReasons[0];
  
  if (!defaultReason) {
      console.warn("⚠️ No cancellation reasons found! Skipping booking_cancellation generation.");
  } else {
      await prisma.$executeRawUnsafe(`
        INSERT INTO booking_cancellation (
          university_id, booking_id, cancellation_reason_id, 
          booking_cancellation_cancelled_by_id, booking_cancellation_cancelled_at
        )
        SELECT 
          b.university_id, 
          b.booking_id, 
          ${defaultReason.cancellation_reason_id},
          st.account_id,
          b.booking_created_at + interval '1 hour' -- Simplified time logic for SQL speed
        FROM booking b
        JOIN student st ON b.student_id = st.student_id
        WHERE b.booking_status = 'CANCELLED'
        ON CONFLICT DO NOTHING;
      `);
  }

  // 2. Assignments
  // logic: Assigned bookings need a record
  console.log("   📋 Generating Assignments (SQL)...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_assignment (
      university_id, booking_id, consultant_id, consultant_university_id,
      assigned_by_account_id, assigned_note, assigned_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      b.consultant_id,
      b.university_id, -- Simplification: Assume same uni for seed optimization
      a.account_id,
      'มอบหมายผู้ให้คำปรึกษา (System Seed)',
      b.booking_created_at + interval '30 minutes'
    FROM booking b
    JOIN account a ON a.account_home_university_id = b.university_id 
      AND a.account_role = 'HEAD_CONSULTANT'
    WHERE b.booking_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
      AND b.consultant_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  `);

  // 3. Sessions (Links & Locations)
  // logic: Provide actual join links or location text for students
  console.log("   🔗 Generating Booking Sessions (SQL)...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_session (
      university_id, booking_id, service_mode_id, 
      online_channel_category_id, booking_session_join_url,
      booking_session_location_text, booking_session_is_link_visible,
      provided_by_account_id, provided_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      b.service_mode_id,
      b.online_channel_category_id,
      CASE 
        WHEN oc.online_channel_code = 'GOOGLE_MEET' THEN 'https://meet.google.com/abc-' || round(random()*1000)::text || '-xyz'
        WHEN oc.online_channel_code = 'ZOOM' THEN 'https://zoom.us/j/' || round(random()*1000000000)::text
        WHEN oc.online_channel_code = 'LINE_CALL' THEN 'https://line.me/R/ti/p/@wellness_line'
        WHEN oc.online_channel_code = 'MICROSOFT_TEAMS' THEN 'https://teams.microsoft.com/l/meetup-join/dummy-' || b.booking_id::text
        ELSE NULL
      END as join_url,
      CASE 
        WHEN smc.code = 'ONSITE' THEN 'ห้องให้คำปรึกษา ชั้น 2 อาคารบริการ (System Seed)'
        ELSE NULL
      END as location_text,
      true,
      c.account_id,
      b.booking_created_at + interval '10 minutes'
    FROM booking b
    JOIN consultant c ON b.consultant_id = c.consultant_id
    LEFT JOIN online_channel_category oc ON b.online_channel_category_id = oc.online_channel_category_id
    LEFT JOIN service_mode_category smc ON b.service_mode_id = smc.service_mode_id
    WHERE b.booking_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
    ON CONFLICT DO NOTHING;
  `);

  // 4. Outcomes (Completed only)
  console.log("   📊 Generating Outcomes (SQL)...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_outcome (
      university_id, booking_id, booking_outcome_consultant_note,
      booking_outcome_next_step, booking_outcome_risk_level
    )
    SELECT
      b.university_id,
      b.booking_id,
      CASE 
        WHEN random() < 0.2 THEN 'นิสิตมีความเครียดเรื่องการจัดสรรเวลาเรียน แนะนำเทคนิคการทำ Timeboxing'
        WHEN random() < 0.4 THEN 'ปัญหาซึมเศร้าเล็กน้อย ให้คำปรึกษาเบื้องต้นและให้แบบประเมินกลับไปทำ'
        WHEN random() < 0.6 THEN 'นิสิตมีปัญหากับเพื่อนร่วมงานในกลุ่ม ได้แนะนำวิธีสื่อสารแบบ Assertive Communication'
        WHEN random() < 0.8 THEN 'มีความกังวลเรื่องอนาคตการทำงานหลังเรียนจบ แนะนำแหล่งข้อมูลฝึกงาน'
        ELSE 'รับฟังปัญหาทั่วไป นิสิตมีภาวะเครียดสะสมจากช่วงสอบ แนะนำการดูแลสุขภาพการนอน'
      END,
      CASE 
        WHEN random() < 0.3 THEN 'นัดติดตามผลในอีก 2 สัปดาห์' 
        WHEN random() < 0.6 THEN 'ให้นิสิตกลับไปลองปรับพฤติกรรมการนอน'
        ELSE NULL 
      END,
      -- 🔥 REALISTIC RISK CALCULATION (1-5)
      -- Base: Gaussian-ish centered around 2-3
      -- Modifiers: University + Faculty
      GREATEST(1, LEAST(5, (
        floor(random() * 3 + 1)::int -- Base 1..3
        +
        (CASE 
           -- High Stress Varsities (Mockup)
           WHEN u.university_code = 'NU' THEN 1  
           WHEN u.university_code = 'CMU' THEN 1
           ELSE 0 
         END)
        +
        (CASE
           -- High Stress Faculties
           WHEN f.faculty_name_en ILIKE '%Engineer%' OR f.faculty_name_th LIKE '%วิศว%' THEN 2
           WHEN f.faculty_name_en ILIKE '%Medic%' OR f.faculty_name_th LIKE '%แพทย์%' THEN 2
           WHEN f.faculty_name_en ILIKE '%Nurs%' OR f.faculty_name_th LIKE '%พยาบาล%' THEN 2
           WHEN f.faculty_name_en ILIKE '%Dent%' OR f.faculty_name_th LIKE '%ทันต%' THEN 1
           WHEN f.faculty_name_en ILIKE '%Sci%' OR f.faculty_name_th LIKE '%วิทย์%' THEN 1
           -- Low Stress Faculties (Relaxed?)
           WHEN f.faculty_name_en ILIKE '%Sport%' OR f.faculty_name_th LIKE '%พลศึกษา%' THEN -1
           WHEN f.faculty_name_en ILIKE '%Art%' OR f.faculty_name_th LIKE '%ศิลป%' THEN -1
           ELSE 0
         END)
        +
        (CASE WHEN random() < 0.1 THEN 1 ELSE 0 END) -- Random spike
      )::int))
    FROM booking b
    JOIN university u ON b.university_id = u.university_id
    JOIN student s ON b.student_id = s.student_id
    LEFT JOIN student_academic sa ON s.student_id = sa.student_id
    LEFT JOIN faculty f ON sa.faculty_id = f.faculty_id
    WHERE b.booking_status = 'COMPLETED'
    ON CONFLICT DO NOTHING;
  `);

  // 4. Feedback (Completed only)
  console.log("   ⭐ Generating Feedbacks (SQL)...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO feedback (
      university_id, booking_id, student_id, consultant_id,
      feedback_is_anonymous
    )
    SELECT
      b.university_id,
      b.booking_id,
      b.student_id,
      b.consultant_id,
      (random() < 0.7)
    FROM booking b
    WHERE b.booking_status = 'COMPLETED'
      AND b.consultant_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  `);

  // 5. Ratings (Join Feedback + Criteria)
  // Realistic ratings: Use Consultant Bias from temp table
  console.log("   🌟 Generating Ratings (using Consultant Bias)...");

  const biasValues = Array.from(consultantBiasById.entries())
    .map(([id, score]) => `(${id}, ${score})`)
    .join(",");

  // Use transaction to ensure temp table persists across commands (same connection)
  await prisma.$transaction(async (tx) => {
    // 5.1 Create Temp Table
    await tx.$executeRawUnsafe(`
      CREATE TEMP TABLE _TempConsultantBias (
        consultant_id INT PRIMARY KEY,
        bias_score FLOAT
      ) ON COMMIT DROP;
    `);

    // 5.2 Populate Temp Table
    if (biasValues) {
      await tx.$executeRawUnsafe(`
        INSERT INTO _TempConsultantBias (consultant_id, bias_score)
        VALUES ${biasValues};
      `);
    }

    // 5.3 Insert Ratings using Bias
    await tx.$executeRawUnsafe(`
      INSERT INTO feedback_rating (
        feedback_id, evaluation_criterion_id, feedback_rating_score
      )
      SELECT
        f.feedback_id,
        c.evaluation_criterion_id,
        CASE 
          WHEN t.bias_score IS NOT NULL THEN
             GREATEST(1, LEAST(5, ROUND(t.bias_score + (random() - 0.5) * 1.5)))
          ELSE
             floor(random() * 3 + 3) -- 3..5
        END
      FROM feedback f
      JOIN booking b ON f.booking_id = b.booking_id
      LEFT JOIN _TempConsultantBias t ON b.consultant_id = t.consultant_id
      CROSS JOIN evaluation_criterion c
      ON CONFLICT DO NOTHING;
    `);
  });

  // 6. Comments (Optional, some feedbacks)
  console.log("   💬 Generating Comments (SQL)...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO feedback_comment (
      feedback_id, feedback_comment_text
    )
    SELECT
      f.feedback_id,
      'ได้รับคำแนะนำที่ดีมาก ขอบคุณครับ/ค่ะ'
    FROM feedback f
    WHERE random() < 0.3
    ON CONFLICT DO NOTHING;
  `);

  // 7. Point Transactions & Wallet
  // Insert transactions for FEEDBACK_SUBMITTED
  if (pointRules.FEEDBACK_SUBMITTED) {
    console.log("   💰 Generating Point Transactions (Feedback Submitted)...");
    await prisma.$executeRawUnsafe(`
      INSERT INTO student_point_transaction (
        student_id, point_rule_id, booking_university_id, booking_id,
        student_point_txn_type, student_point_amount, student_point_note
      )
      SELECT
        b.student_id,
        ${pointRules.FEEDBACK_SUBMITTED.point_rule_id},
        b.university_id,
        b.booking_id,
        'EARN',
        ${pointRules.FEEDBACK_SUBMITTED.point_rule_points},
        'Reward points for feedback submission'
      FROM booking b
      JOIN feedback f ON b.booking_id = f.booking_id
      WHERE b.booking_status = 'COMPLETED'
      ON CONFLICT DO NOTHING;
    `);
  }

  // Update Wallets (Aggregate)
  console.log("   💳 Updating Wallets (SQL Aggregate)...");
  // Upsert pattern for wallets
  await prisma.$executeRawUnsafe(`
    INSERT INTO student_point_wallet (university_id, student_id, student_point_balance)
    SELECT 
      student.university_id, 
      student.student_id, 
      COALESCE(SUM(student_point_amount), 0)
    FROM student
    LEFT JOIN student_point_transaction txn ON student.student_id = txn.student_id
    GROUP BY student.university_id, student.student_id
    ON CONFLICT (university_id, student_id) 
    DO UPDATE SET student_point_balance = EXCLUDED.student_point_balance;
  `);

  console.log("   ✅ All phases complete.");
}
