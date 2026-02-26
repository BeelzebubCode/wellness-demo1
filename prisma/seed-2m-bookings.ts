// prisma/seed-2m-bookings.ts
// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive 2M booking seed with ALL related tables
// Uses pure SQL (generate_series + JOINs) for maximum speed
//
// Tables seeded:
//   1. booking              — 2,000,000 rows
//   2. booking_assignment   — ~1,750,000 (ASSIGNED/IN_PROGRESS/COMPLETED)
//   3. booking_session      — ~1,750,000
//   4. booking_outcome      — ~1,700,000 (COMPLETED only, risk by faculty)
//   5. booking_cancellation — ~200,000 (CANCELLED, weighted reasons)
//   6. booking_attendance   — ~1,720,000 (COMPLETED + IN_PROGRESS)
//   7. feedback             — ~60% of COMPLETED
//   8. feedback_rating      — feedback × criteria
//   9. feedback_comment     — ~30% of feedbacks
//  10. student_point_transaction — 1 per feedback
//  11. student_point_wallet — aggregate
//
// Usage:
//   npx tsx prisma/seed-2m-bookings.ts
//   npx tsx prisma/seed-2m-bookings.ts --clean   (wipe booking data first)
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Config ──────────────────────────────────────────────────────────────────
const COMPLETED_COUNT = 1_700_000;  // 85%
const CANCELLED_COUNT = 200_000;  // 10%
const PENDING_COUNT = 50_000;  // 2.5%
const ASSIGNED_COUNT = 30_000;  // 1.5%
const IN_PROGRESS_COUNT = 20_000;  // 1%

// Date range: 12 months of data
const DATE_START = "2025-01-01";
const DATE_END = "2025-12-31";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function elapsed(start: number): string {
  return ((Date.now() - start) / 1000).toFixed(1) + "s";
}

async function exec(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

// ─── Clean ───────────────────────────────────────────────────────────────────
async function cleanBookingData() {
  console.log("🧹 Cleaning existing booking data...");
  const t = Date.now();

  // Delete in dependency order (children first)
  const tables = [
    "student_point_transaction",
    "student_point_wallet",
    "feedback_comment",
    "feedback_rating",
    "feedback",
    "booking_exception_evidence",
    "booking_exception_request",
    "booking_punishment_log",
    "booking_attendance",
    "booking_consent_signature",
    "booking_session",
    "booking_assignment",
    "booking_outcome",
    "booking_cancellation",
    "notification",
    "booking",
  ];

  for (const table of tables) {
    await exec(`TRUNCATE TABLE "${table}" CASCADE`);
  }

  console.log(`   ✅ Cleaned in ${elapsed(t)}\n`);
}

// ─── Phase 0: Pre-flight checks ─────────────────────────────────────────────
async function preflight(): Promise<{
  studentCount: number;
  consultantCount: number;
  timeSlotCount: number;
  problemCategoryCount: number;
  criteriaCount: number;
}> {
  console.log("🔍 Pre-flight checks...");

  const [students, consultants, timeSlots, categories, criteria] = await Promise.all([
    prisma.student.count(),
    prisma.consultant.count(),
    prisma.timeSlot.count(),
    prisma.problemCategory.count(),
    prisma.evaluationCriterion.count(),
  ]);

  console.log(`   Students:           ${students.toLocaleString()}`);
  console.log(`   Consultants:        ${consultants.toLocaleString()}`);
  console.log(`   Time Slots:         ${timeSlots.toLocaleString()}`);
  console.log(`   Problem Categories: ${categories}`);
  console.log(`   Eval Criteria:      ${criteria}`);

  if (students === 0 || consultants === 0 || timeSlots === 0 || categories === 0) {
    throw new Error("❌ Missing prerequisite data. Run full seed first.");
  }

  console.log("   ✅ All prerequisites met\n");
  return {
    studentCount: students,
    consultantCount: consultants,
    timeSlotCount: timeSlots,
    problemCategoryCount: categories,
    criteriaCount: criteria,
  };
}

// ─── Phase 1: Booking rows ──────────────────────────────────────────────────
async function seedBookings() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📅 Phase 1: Creating booking rows");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // We use a temp helper table to assign students multiple bookings
  // Each student gets 1-8 bookings (weighted: most get 2-4)
  // generate_series creates row multipliers per student

  // ── COMPLETED (1.7M) ──
  console.log(`\n   [1/5] COMPLETED: ${COMPLETED_COUNT.toLocaleString()}...`);
  let t = Date.now();
  await exec(`
    INSERT INTO booking (
      university_id, student_id, consultant_id, time_slot_id,
      problem_category_id, online_channel_category_id,
      booking_detail_text, booking_service_mode, booking_status,
      booking_created_at, booking_updated_at
    )
    SELECT
      sub.university_id,
      sub.student_id,
      sub.consultant_id,
      sub.time_slot_id,
      sub.problem_category_id,
      sub.online_channel_category_id,
      sub.booking_detail_text,
      sub.booking_service_mode,
      'COMPLETED'::"BookingStatus",
      sub.created_at,
      sub.created_at + interval '2 hours'
    FROM (
      SELECT
        s.university_id,
        s.student_id,
        c.consultant_id,
        ts.time_slot_id,
        pc.problem_category_id,
        CASE WHEN random() > 0.3
          THEN oc.online_channel_category_id
          ELSE NULL
        END AS online_channel_category_id,
        -- Realistic detail text based on problem
        CASE (gs.n % 5)
          WHEN 0 THEN 'รู้สึกเครียดจากการเรียน ต้องการคำปรึกษา'
          WHEN 1 THEN 'มีปัญหาความสัมพันธ์กับเพื่อน อยากพูดคุย'
          WHEN 2 THEN 'กังวลเรื่องอนาคตและการหางาน'
          WHEN 3 THEN 'นอนไม่หลับ มีความวิตกกังวลบ่อย'
          ELSE 'ต้องการปรึกษาเรื่องส่วนตัว'
        END AS booking_detail_text,
        CASE WHEN random() > 0.3
          THEN 'ONLINE'::"ServiceMode"
          ELSE 'ONSITE'::"ServiceMode"
        END AS booking_service_mode,
        -- Spread over 12 months with exam-period spikes
        '${DATE_START}'::timestamp + (
          random() * ('${DATE_END}'::timestamp - '${DATE_START}'::timestamp)
        ) AS created_at
      FROM (
        SELECT student_id, university_id,
               ROW_NUMBER() OVER (ORDER BY random()) AS rn
        FROM student
      ) s
      -- Generate 1-8 bookings per student row (but cap total)
      CROSS JOIN generate_series(1, 8) AS gs(n)
      -- Pick a consultant from same university
      JOIN LATERAL (
        SELECT consultant_id
        FROM consultant
        WHERE consultant.university_id = s.university_id
        ORDER BY (consultant.consultant_id * 31 + gs.n * 7) % 97, random()
        LIMIT 1
      ) c ON true
      -- Pick a timeslot from same university
      JOIN LATERAL (
        SELECT time_slot_id
        FROM time_slot
        WHERE time_slot.university_id = s.university_id
        ORDER BY (time_slot.time_slot_id * 17 + gs.n * 13) % 89
        LIMIT 1
      ) ts ON true
      -- Pick a problem category (weighted by gs.n for variety)
      JOIN LATERAL (
        SELECT problem_category_id
        FROM problem_category
        ORDER BY (problem_category_id * 23 + gs.n * 11 + s.student_id) % 71
        LIMIT 1
      ) pc ON true
      -- Pick an online channel
      JOIN LATERAL (
        SELECT online_channel_category_id
        FROM online_channel_category
        WHERE is_active = true
        ORDER BY (online_channel_category_id * 19 + gs.n) % 37
        LIMIT 1
      ) oc ON true
      ORDER BY random()
      LIMIT ${COMPLETED_COUNT}
    ) sub
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ✅ Done in ${elapsed(t)}`);

  // ── CANCELLED (200K) ──
  console.log(`\n   [2/5] CANCELLED: ${CANCELLED_COUNT.toLocaleString()}...`);
  t = Date.now();
  await exec(`
    INSERT INTO booking (
      university_id, student_id, consultant_id, time_slot_id,
      problem_category_id, online_channel_category_id,
      booking_detail_text, booking_service_mode, booking_status,
      booking_created_at, booking_updated_at
    )
    SELECT
      s.university_id,
      s.student_id,
      NULL,
      ts.time_slot_id,
      pc.problem_category_id,
      CASE WHEN random() > 0.4
        THEN (SELECT online_channel_category_id FROM online_channel_category WHERE is_active = true ORDER BY random() LIMIT 1)
        ELSE NULL
      END,
      CASE (s.rn % 4)
        WHEN 0 THEN 'จองแล้วแต่ติดธุระ ขอยกเลิก'
        WHEN 1 THEN 'อาการดีขึ้นแล้ว ไม่ต้องพบ'
        WHEN 2 THEN 'เปลี่ยนเป็นนัดวันอื่นแทน'
        ELSE 'ต้องการยกเลิกการจอง'
      END,
      CASE WHEN random() > 0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END,
      'CANCELLED'::"BookingStatus",
      '${DATE_START}'::timestamp + (random() * ('${DATE_END}'::timestamp - '${DATE_START}'::timestamp)),
      '${DATE_START}'::timestamp + (random() * ('${DATE_END}'::timestamp - '${DATE_START}'::timestamp))
    FROM (
      SELECT student_id, university_id, ROW_NUMBER() OVER (ORDER BY random()) AS rn
      FROM student ORDER BY random() LIMIT ${CANCELLED_COUNT}
    ) s
    JOIN LATERAL (
      SELECT time_slot_id FROM time_slot
      WHERE time_slot.university_id = s.university_id
      ORDER BY random() LIMIT 1
    ) ts ON true
    JOIN LATERAL (
      SELECT problem_category_id FROM problem_category ORDER BY random() LIMIT 1
    ) pc ON true
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ✅ Done in ${elapsed(t)}`);

  // ── ASSIGNED (30K) ──
  console.log(`\n   [3/5] ASSIGNED: ${ASSIGNED_COUNT.toLocaleString()}...`);
  t = Date.now();
  await exec(`
    INSERT INTO booking (
      university_id, student_id, consultant_id, time_slot_id,
      problem_category_id, online_channel_category_id,
      booking_detail_text, booking_service_mode, booking_status,
      booking_created_at, booking_updated_at
    )
    SELECT
      s.university_id,
      s.student_id,
      c.consultant_id,
      ts.time_slot_id,
      pc.problem_category_id,
      CASE WHEN random() > 0.3
        THEN (SELECT online_channel_category_id FROM online_channel_category WHERE is_active = true ORDER BY random() LIMIT 1)
        ELSE NULL
      END,
      'รอพบผู้ให้คำปรึกษาตามนัด',
      CASE WHEN random() > 0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END,
      'ASSIGNED'::"BookingStatus",
      NOW() - (random() * interval '14 days'),
      NOW() - (random() * interval '7 days')
    FROM (
      SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${ASSIGNED_COUNT}
    ) s
    JOIN LATERAL (
      SELECT consultant_id FROM consultant
      WHERE consultant.university_id = s.university_id ORDER BY random() LIMIT 1
    ) c ON true
    JOIN LATERAL (
      SELECT time_slot_id FROM time_slot
      WHERE time_slot.university_id = s.university_id ORDER BY random() LIMIT 1
    ) ts ON true
    JOIN LATERAL (
      SELECT problem_category_id FROM problem_category ORDER BY random() LIMIT 1
    ) pc ON true
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ✅ Done in ${elapsed(t)}`);

  // ── IN_PROGRESS (20K) ──
  console.log(`\n   [4/5] IN_PROGRESS: ${IN_PROGRESS_COUNT.toLocaleString()}...`);
  t = Date.now();
  await exec(`
    INSERT INTO booking (
      university_id, student_id, consultant_id, time_slot_id,
      problem_category_id, online_channel_category_id,
      booking_detail_text, booking_service_mode, booking_status,
      booking_created_at, booking_updated_at
    )
    SELECT
      s.university_id,
      s.student_id,
      c.consultant_id,
      ts.time_slot_id,
      pc.problem_category_id,
      CASE WHEN random() > 0.3
        THEN (SELECT online_channel_category_id FROM online_channel_category WHERE is_active = true ORDER BY random() LIMIT 1)
        ELSE NULL
      END,
      'กำลังรับคำปรึกษาอยู่',
      CASE WHEN random() > 0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END,
      'IN_PROGRESS'::"BookingStatus",
      NOW() - (random() * interval '3 days'),
      NOW() - (random() * interval '1 day')
    FROM (
      SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${IN_PROGRESS_COUNT}
    ) s
    JOIN LATERAL (
      SELECT consultant_id FROM consultant
      WHERE consultant.university_id = s.university_id ORDER BY random() LIMIT 1
    ) c ON true
    JOIN LATERAL (
      SELECT time_slot_id FROM time_slot
      WHERE time_slot.university_id = s.university_id ORDER BY random() LIMIT 1
    ) ts ON true
    JOIN LATERAL (
      SELECT problem_category_id FROM problem_category ORDER BY random() LIMIT 1
    ) pc ON true
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ✅ Done in ${elapsed(t)}`);

  // ── PENDING_ASSIGNMENT (50K) ──
  console.log(`\n   [5/5] PENDING_ASSIGNMENT: ${PENDING_COUNT.toLocaleString()}...`);
  t = Date.now();
  await exec(`
    INSERT INTO booking (
      university_id, student_id, consultant_id, time_slot_id,
      problem_category_id, online_channel_category_id,
      booking_detail_text, booking_service_mode, booking_status,
      booking_created_at, booking_updated_at
    )
    SELECT
      s.university_id,
      s.student_id,
      NULL,
      ts.time_slot_id,
      pc.problem_category_id,
      CASE WHEN random() > 0.4
        THEN (SELECT online_channel_category_id FROM online_channel_category WHERE is_active = true ORDER BY random() LIMIT 1)
        ELSE NULL
      END,
      'รอระบบจัดเจ้าหน้าที่ให้',
      CASE WHEN random() > 0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END,
      'PENDING_ASSIGNMENT'::"BookingStatus",
      NOW() - (random() * interval '7 days'),
      NOW() - (random() * interval '3 days')
    FROM (
      SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${PENDING_COUNT}
    ) s
    JOIN LATERAL (
      SELECT time_slot_id FROM time_slot
      WHERE time_slot.university_id = s.university_id ORDER BY random() LIMIT 1
    ) ts ON true
    JOIN LATERAL (
      SELECT problem_category_id FROM problem_category ORDER BY random() LIMIT 1
    ) pc ON true
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ✅ Done in ${elapsed(t)}`);

  const total = await prisma.booking.count();
  console.log(`\n   📊 Total bookings created: ${total.toLocaleString()}`);
}

// ─── Phase 2: Booking Assignments ───────────────────────────────────────────
async function seedAssignments() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Phase 2: Booking Assignments");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  await exec(`
    INSERT INTO booking_assignment (
      university_id, booking_id, consultant_id, consultant_university_id,
      assigned_by_account_id, is_auto_assigned, assigned_note, assigned_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      b.consultant_id,
      b.university_id,
      head.account_id,
      (random() < 0.4),
      CASE (b.booking_id % 4)
        WHEN 0 THEN 'ระบบจัดสรรอัตโนมัติ'
        WHEN 1 THEN 'มอบหมายตามความเชี่ยวชาญ'
        WHEN 2 THEN 'มอบหมายตามตารางเวร'
        ELSE 'มอบหมายผู้ให้คำปรึกษา'
      END,
      b.booking_created_at + interval '30 minutes' + (random() * interval '2 hours')
    FROM booking b
    JOIN LATERAL (
      SELECT account_id FROM account
      WHERE account.account_home_university_id = b.university_id
        AND account.account_role = 'HEAD_CONSULTANT'
      LIMIT 1
    ) head ON true
    WHERE b.booking_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
      AND b.consultant_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_assignment`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} assignments in ${elapsed(t)}`);
}

// ─── Phase 3: Booking Sessions ──────────────────────────────────────────────
async function seedSessions() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔗 Phase 3: Booking Sessions (links & locations)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  await exec(`
    INSERT INTO booking_session (
      university_id, booking_id, booking_session_mode,
      online_channel_category_id, booking_session_join_url,
      booking_session_location_text, booking_session_is_link_visible,
      provided_by_account_id, provided_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      b.booking_service_mode,
      b.online_channel_category_id,
      CASE
        WHEN oc.online_channel_code = 'GOOGLE_MEET'      THEN 'https://meet.google.com/abc-' || (b.booking_id % 9999)::text || '-xyz'
        WHEN oc.online_channel_code = 'ZOOM'              THEN 'https://zoom.us/j/' || (1000000000 + b.booking_id)::text
        WHEN oc.online_channel_code = 'LINE_CALL'         THEN 'https://line.me/R/ti/p/@wellness'
        WHEN oc.online_channel_code = 'MICROSOFT_TEAMS'   THEN 'https://teams.microsoft.com/l/meetup-join/' || b.booking_id::text
        WHEN oc.online_channel_code = 'PHONE'             THEN NULL
        ELSE NULL
      END,
      CASE
        WHEN b.booking_service_mode = 'ONSITE' THEN
          CASE (b.booking_id % 4)
            WHEN 0 THEN 'ห้องให้คำปรึกษา ชั้น 2 อาคารบริการนิสิต'
            WHEN 1 THEN 'ศูนย์สุขภาวะ ห้อง 301 อาคารกิจการนิสิต'
            WHEN 2 THEN 'ห้องพักผ่อน ชั้น 3 หอสมุดกลาง'
            ELSE 'ห้องให้คำปรึกษา ศูนย์สุขภาพจิต ชั้น 1'
          END
        ELSE NULL
      END,
      true,
      c.account_id,
      b.booking_created_at + interval '15 minutes'
    FROM booking b
    JOIN consultant c ON b.consultant_id = c.consultant_id
    LEFT JOIN online_channel_category oc ON b.online_channel_category_id = oc.online_channel_category_id
    WHERE b.booking_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_session`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} sessions in ${elapsed(t)}`);
}

// ─── Phase 4: Booking Outcomes ──────────────────────────────────────────────
async function seedOutcomes() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Phase 4: Booking Outcomes (risk levels by faculty)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  await exec(`
    INSERT INTO booking_outcome (
      university_id, booking_id,
      booking_outcome_consultant_note,
      booking_outcome_next_step,
      booking_outcome_risk_level,
      booking_outcome_recorded_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      -- Realistic consultant notes
      CASE (b.booking_id % 8)
        WHEN 0 THEN 'นิสิตมีความเครียดสะสมจากการเรียน แนะนำเทคนิค Time Management และ Mindfulness'
        WHEN 1 THEN 'ปัญหาซึมเศร้าเล็กน้อย ให้คำปรึกษาเบื้องต้นและแนะนำแบบประเมิน PHQ-9'
        WHEN 2 THEN 'มีปัญหาความสัมพันธ์กับเพื่อนร่วมห้อง ได้ใช้ CBT เบื้องต้นช่วยปรับมุมมอง'
        WHEN 3 THEN 'กังวลเรื่องอนาคตการทำงาน แนะนำแหล่งข้อมูลฝึกงานและ Career Planning'
        WHEN 4 THEN 'นิสิตมีภาวะ Burnout จากกิจกรรมมากเกินไป แนะนำการจัดลำดับความสำคัญ'
        WHEN 5 THEN 'ปัญหาครอบครัว มีความขัดแย้งกับผู้ปกครองเรื่องทิศทางการเรียน ให้การ Support'
        WHEN 6 THEN 'รับฟังปัญหาทั่วไป นิสิตมีภาวะเครียดสะสมจากช่วงสอบ แนะนำ Sleep Hygiene'
        ELSE 'ให้คำปรึกษาเชิงจิตวิทยา นิสิตมีอาการวิตกกังวลจากการนำเสนองาน ฝึก Relaxation Technique'
      END,
      -- Next step
      CASE (b.booking_id % 5)
        WHEN 0 THEN 'นัดติดตามผลในอีก 2 สัปดาห์'
        WHEN 1 THEN 'ให้นิสิตกลับไปลองปรับพฤติกรรมการนอน แล้วมารายงานผล'
        WHEN 2 THEN 'ส่งต่อพบจิตแพทย์เพื่อประเมินเพิ่มเติม'
        WHEN 3 THEN 'แนะนำเข้าร่วมกลุ่มบำบัด (Group Therapy) รุ่นถัดไป'
        ELSE NULL
      END,
      -- Risk level 1-5 (realistic: weighted by faculty type)
      GREATEST(1, LEAST(5, (
        -- Base: Most students are low-moderate risk
        (CASE
          WHEN random() < 0.30 THEN 1  -- 30% normal
          WHEN random() < 0.60 THEN 2  -- 30% mild
          WHEN random() < 0.80 THEN 3  -- 20% moderate
          WHEN random() < 0.95 THEN 4  -- 15% high
          ELSE 5                        -- 5% severe
        END)
        +
        -- Faculty stress modifier
        (CASE
          WHEN f.faculty_name_th LIKE '%วิศว%'     THEN 1
          WHEN f.faculty_name_th LIKE '%แพทย%'     THEN 1
          WHEN f.faculty_name_th LIKE '%พยาบาล%'   THEN 1
          WHEN f.faculty_name_th LIKE '%เภสัช%'    THEN 1
          WHEN f.faculty_name_th LIKE '%ทันต%'     THEN 1
          WHEN f.faculty_name_th LIKE '%สถาปัตย%'  THEN 1
          WHEN f.faculty_name_th LIKE '%ศิลป%'    THEN -1
          WHEN f.faculty_name_th LIKE '%พลศึกษา%' THEN -1
          WHEN f.faculty_name_th LIKE '%ดนตรี%'   THEN -1
          ELSE 0
        END)
        +
        -- Random spike (10% chance of +1)
        (CASE WHEN random() < 0.10 THEN 1 ELSE 0 END)
      )::int)),
      b.booking_created_at + interval '1 hour' + (random() * interval '24 hours')
    FROM booking b
    JOIN student s ON b.student_id = s.student_id AND b.university_id = s.university_id
    LEFT JOIN student_academic sa ON s.student_id = sa.student_id AND s.university_id = sa.university_id
    LEFT JOIN faculty f ON sa.faculty_id = f.faculty_id AND sa.university_id = f.university_id
    WHERE b.booking_status = 'COMPLETED'
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_outcome`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} outcomes in ${elapsed(t)}`);
}

// ─── Phase 5: Booking Cancellations ─────────────────────────────────────────
async function seedCancellations() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("❌ Phase 5: Booking Cancellations (weighted reasons)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  // Use weighted cancellation reasons via a CTE
  await exec(`
    INSERT INTO booking_cancellation (
      university_id, booking_id,
      cancellation_reason_id,
      booking_cancellation_note,
      booking_cancellation_cancelled_by_id,
      booking_cancellation_cancelled_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      -- Weighted reason: RESCHEDULE 30%, FEELING_BETTER 25%, EMERGENCY 15%, WRONG_BOOKING 10%, LOCATION_ISSUE 10%, OTHER 10%
      (
        SELECT cr.cancellation_reason_id
        FROM cancellation_reason cr
        ORDER BY
          CASE cr.cancellation_reason_code
            WHEN 'RESCHEDULE'     THEN random() * 0.30
            WHEN 'FEELING_BETTER' THEN random() * 0.25
            WHEN 'EMERGENCY'      THEN random() * 0.15
            WHEN 'STUDENT_BUSY'   THEN random() * 0.20
            WHEN 'STUDENT_SICK'   THEN random() * 0.10
            WHEN 'FOUND_SOLUTION' THEN random() * 0.15
            WHEN 'WRONG_BOOKING'  THEN random() * 0.10
            WHEN 'LOCATION_ISSUE' THEN random() * 0.10
            ELSE random() * 0.05
          END DESC
        LIMIT 1
      ),
      CASE (b.booking_id % 5)
        WHEN 0 THEN 'ติดสอบกลางภาค ไม่สะดวกตามนัด'
        WHEN 1 THEN 'อาการดีขึ้นมากแล้ว ขอบคุณครับ/ค่ะ'
        WHEN 2 THEN NULL
        WHEN 3 THEN 'ขอเลื่อนนัดไปสัปดาห์หน้าแทน'
        ELSE 'ไม่สะดวกมาตามนัด'
      END,
      st.account_id,
      b.booking_created_at + interval '1 hour' + (random() * interval '48 hours')
    FROM booking b
    JOIN student st ON b.student_id = st.student_id AND b.university_id = st.university_id
    WHERE b.booking_status = 'CANCELLED'
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_cancellation`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} cancellations in ${elapsed(t)}`);
}

// ─── Phase 6: Booking Attendance ────────────────────────────────────────────
async function seedAttendance() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Phase 6: Booking Attendance");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  await exec(`
    INSERT INTO booking_attendance (
      university_id, booking_id,
      booking_attendance_status,
      booking_attendance_checked_in_at,
      booking_attendance_late_minutes,
      booking_attendance_note,
      booking_attendance_marked_by_id,
      booking_attendance_marked_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      -- Realistic distribution: 70% checked_in, 15% late, 10% no_show, 5% cancelled_by_consultant
      CASE
        WHEN random() < 0.70 THEN 'CHECKED_IN'::"AttendanceStatus"
        WHEN random() < 0.85 THEN 'LATE'::"AttendanceStatus"
        WHEN random() < 0.95 THEN 'NO_SHOW'::"AttendanceStatus"
        ELSE 'CANCELLED_BY_CONSULTANT'::"AttendanceStatus"
      END,
      -- checked_in_at: only for CHECKED_IN/LATE
      CASE
        WHEN random() < 0.85 THEN ts.time_slot_start_datetime + (random() * interval '15 minutes')
        ELSE NULL
      END,
      -- late_minutes: only meaningful for LATE
      CASE
        WHEN random() >= 0.70 AND random() < 0.85 THEN (5 + floor(random() * 25))::int
        ELSE NULL
      END,
      NULL,
      c.account_id,
      ts.time_slot_start_datetime + interval '5 minutes'
    FROM booking b
    JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id AND b.university_id = ts.university_id
    JOIN consultant c ON b.consultant_id = c.consultant_id
    WHERE b.booking_status IN ('COMPLETED', 'IN_PROGRESS')
      AND b.consultant_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_attendance`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} attendance records in ${elapsed(t)}`);
}

// ─── Phase 7: Feedback ──────────────────────────────────────────────────────
async function seedFeedback() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⭐ Phase 7: Feedback (~60% of completed)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  await exec(`
    INSERT INTO feedback (
      university_id, booking_id, student_id, consultant_id,
      consultant_university_id, feedback_is_anonymous, feedback_created_at
    )
    SELECT
      b.university_id,
      b.booking_id,
      b.student_id,
      b.consultant_id,
      b.university_id,
      (random() < 0.65),
      b.booking_created_at + interval '3 hours' + (random() * interval '72 hours')
    FROM booking b
    WHERE b.booking_status = 'COMPLETED'
      AND b.consultant_id IS NOT NULL
      AND random() < 0.60
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} feedbacks in ${elapsed(t)}`);
}

// ─── Phase 8: Feedback Ratings ──────────────────────────────────────────────
async function seedRatings() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌟 Phase 8: Feedback Ratings (feedback × criteria)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  // Realistic: most ratings are 3-5 with consultant-level bias
  await exec(`
    INSERT INTO feedback_rating (
      feedback_id, evaluation_criterion_id, feedback_rating_score
    )
    SELECT
      f.feedback_id,
      ec.evaluation_criterion_id,
      -- Realistic rating: biased toward 3-5
      -- Use consultant_id as a stable bias seed (some consultants consistently get better scores)
      GREATEST(1, LEAST(5,
        CASE
          -- ~40% get 5 stars (great)
          WHEN random() < 0.40 THEN 5
          -- ~30% get 4 stars (good)
          WHEN random() < 0.70 THEN 4
          -- ~20% get 3 stars (ok)
          WHEN random() < 0.90 THEN 3
          -- ~7% get 2 stars
          WHEN random() < 0.97 THEN 2
          -- ~3% get 1 star
          ELSE 1
        END
        +
        -- Consultant bias: better consultants (lower id % 3) get +1
        CASE WHEN (f.consultant_id % 3) = 0 THEN 1 ELSE 0 END
        -
        -- Some random noise
        CASE WHEN random() < 0.15 THEN 1 ELSE 0 END
      ))
    FROM feedback f
    CROSS JOIN evaluation_criterion ec
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback_rating`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} ratings in ${elapsed(t)}`);
}

// ─── Phase 9: Feedback Comments ─────────────────────────────────────────────
async function seedComments() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💬 Phase 9: Feedback Comments (~30% of feedbacks)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  await exec(`
    INSERT INTO feedback_comment (
      feedback_id, feedback_comment_text
    )
    SELECT
      f.feedback_id,
      CASE (f.feedback_id % 10)
        WHEN 0 THEN 'ได้รับคำแนะนำที่ดีมากครับ/ค่ะ ขอบคุณมากๆ'
        WHEN 1 THEN 'พี่ที่ปรึกษาเข้าใจปัญหาดีมาก รู้สึกสบายใจขึ้น'
        WHEN 2 THEN 'บรรยากาศดี เป็นกันเอง ไม่กดดัน'
        WHEN 3 THEN 'อยากให้เพิ่มช่วงเวลาให้คำปรึกษาช่วงเย็นด้วยครับ'
        WHEN 4 THEN 'ได้เรียนรู้เทคนิคการจัดการเวลาที่ดีมาก จะลองไปใช้'
        WHEN 5 THEN 'ครั้งแรกที่ใช้บริการ ประทับใจมาก จะมาอีก'
        WHEN 6 THEN 'อยากให้มี session ยาวกว่านี้หน่อย 30 นาทีรู้สึกสั้นไป'
        WHEN 7 THEN 'ดีมากค่ะ รู้สึกโล่งใจขึ้นมากเลย'
        WHEN 8 THEN 'ขอบคุณที่รับฟังปัญหาโดยไม่ตัดสิน เป็นประสบการณ์ที่ดี'
        ELSE 'ขอบคุณครับ/ค่ะ สบายใจขึ้นมาก'
      END
    FROM feedback f
    WHERE random() < 0.30
    ON CONFLICT DO NOTHING;
  `);

  const count: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback_comment`);
  console.log(`   ✅ Created ${Number(count[0].count).toLocaleString()} comments in ${elapsed(t)}`);
}

// ─── Phase 10: Point Transactions ───────────────────────────────────────────
async function seedPoints() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💰 Phase 10: Point Transactions & Wallets");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const t = Date.now();

  // Get the FEEDBACK_SUBMITTED rule
  const rule = await prisma.pointRule.findUnique({
    where: { point_rule_code: "FEEDBACK_SUBMITTED" },
  });

  if (!rule) {
    console.log("   ⚠️  No FEEDBACK_SUBMITTED point rule found, skipping points.");
    return;
  }

  // 10a. Insert point transactions for each feedback
  await exec(`
    INSERT INTO student_point_transaction (
      student_id, point_rule_id, booking_university_id, booking_id,
      student_point_txn_type, student_point_amount, student_point_note
    )
    SELECT
      b.student_id,
      ${rule.point_rule_id},
      b.university_id,
      b.booking_id,
      'EARN'::"PointTxnType",
      ${rule.point_rule_points},
      'ได้รับแต้มจากการส่งแบบประเมิน'
    FROM feedback f
    JOIN booking b ON f.booking_id = b.booking_id AND f.university_id = b.university_id
    ON CONFLICT DO NOTHING;
  `);

  const txCount: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM student_point_transaction`);
  console.log(`   ✅ Created ${Number(txCount[0].count).toLocaleString()} point transactions`);

  // 10b. Aggregate into wallets
  await exec(`
    INSERT INTO student_point_wallet (university_id, student_id, student_point_balance)
    SELECT
      s.university_id,
      s.student_id,
      COALESCE(SUM(txn.student_point_amount), 0)
    FROM student s
    LEFT JOIN student_point_transaction txn ON s.student_id = txn.student_id
    GROUP BY s.university_id, s.student_id
    ON CONFLICT (university_id, student_id)
    DO UPDATE SET student_point_balance = EXCLUDED.student_point_balance;
  `);

  const walletCount: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM student_point_wallet`);
  console.log(`   ✅ Updated ${Number(walletCount[0].count).toLocaleString()} wallets in ${elapsed(t)}`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
async function printSummary() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 FINAL SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const tables = [
    "booking",
    "booking_assignment",
    "booking_session",
    "booking_outcome",
    "booking_cancellation",
    "booking_attendance",
    "feedback",
    "feedback_rating",
    "feedback_comment",
    "student_point_transaction",
    "student_point_wallet",
  ];

  for (const table of tables) {
    const result: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM "${table}"`);
    const count = Number(result[0].count);
    console.log(`   ${table.padEnd(30)} ${count.toLocaleString().padStart(12)}`);
  }

  // Status distribution
  console.log("\n   📈 Booking Status Distribution:");
  const statuses: { booking_status: string; count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT booking_status, COUNT(*)::bigint as count
    FROM booking GROUP BY booking_status ORDER BY count DESC
  `);
  for (const s of statuses) {
    console.log(`      ${s.booking_status.padEnd(22)} ${Number(s.count).toLocaleString().padStart(12)}`);
  }

  // Risk distribution
  console.log("\n   🎯 Risk Level Distribution:");
  const risks: { booking_outcome_risk_level: number; count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT booking_outcome_risk_level, COUNT(*)::bigint as count
    FROM booking_outcome
    WHERE booking_outcome_risk_level IS NOT NULL
    GROUP BY booking_outcome_risk_level ORDER BY booking_outcome_risk_level
  `);
  for (const r of risks) {
    console.log(`      Level ${r.booking_outcome_risk_level}:   ${Number(r.count).toLocaleString().padStart(12)}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const totalStart = Date.now();

  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  🚀 Comprehensive 2M Booking Seed                   ║");
  console.log("║  Generates realistic data across 11 tables           ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  // Parse --clean flag
  const shouldClean = process.argv.includes("--clean");

  // PostgreSQL optimizations for bulk insert
  console.log("⚡ Enabling PostgreSQL bulk insert optimizations...");
  await exec(`SET synchronous_commit = OFF`);
  await exec(`SET work_mem = '512MB'`);
  await exec(`SET maintenance_work_mem = '1GB'`);
  console.log("   ✅ Optimizations enabled\n");

  if (shouldClean) {
    await cleanBookingData();
  }

  await preflight();

  // Execute all phases sequentially
  await seedBookings();
  await seedAssignments();
  await seedSessions();
  await seedOutcomes();
  await seedCancellations();
  await seedAttendance();
  await seedFeedback();
  await seedRatings();
  await seedComments();
  await seedPoints();
  await printSummary();

  // Reset PostgreSQL settings
  await exec(`SET synchronous_commit = ON`);

  console.log(`\n🎉 All done! Total time: ${elapsed(totalStart)}`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
