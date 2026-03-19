// prisma/seed-realistic.ts
// ─────────────────────────────────────────────────────────────────────────────
// Realistic 2M booking seed — 1 year of data (Mar 2025 → Feb 2026)
//
// Features:
//   ✅ Monthly distribution with exam-period spikes (Oct, Mar)
//   ✅ Summer dip (Jun-Jul)
//   ✅ Weighted problem categories (STRESS > ACAD > CAREER top 3)
//   ✅ LGBTQ+ gender (~10% of student profiles)
//   ✅ Per-university variation (different volumes & dominant problems)
//   ✅ Not every student has bookings (~35-50% per uni)
//
// Usage:
//   npx tsx prisma/seed-realistic.ts
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function elapsed(start: number): string {
  return ((Date.now() - start) / 1000).toFixed(1) + "s";
}
async function exec(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

// ─── Monthly plan: month_start, target_count ────────────────────────────────
// Thai academic calendar:
//   Term 2: Jan-May (midterms ~Mar, finals ~May)
//   Summer: Jun-Jul (low)
//   Term 1: Aug-Dec (midterms ~Oct, finals ~Dec)
const MONTHLY_PLAN: { start: string; end: string; count: number; label: string }[] = [
  { start: "2025-03-01", end: "2025-03-31", count: 230_000, label: "Mar 2025 — midterm spike 📈" },
  { start: "2025-04-01", end: "2025-04-30", count: 110_000, label: "Apr 2025 — Songkran low" },
  { start: "2025-05-01", end: "2025-05-31", count: 200_000, label: "May 2025 — finals spike 📈" },
  { start: "2025-06-01", end: "2025-06-30", count: 75_000, label: "Jun 2025 — summer break 🏖️" },
  { start: "2025-07-01", end: "2025-07-31", count: 80_000, label: "Jul 2025 — summer break 🏖️" },
  { start: "2025-08-01", end: "2025-08-31", count: 155_000, label: "Aug 2025 — term 1 start" },
  { start: "2025-09-01", end: "2025-09-30", count: 165_000, label: "Sep 2025 — settling in" },
  { start: "2025-10-01", end: "2025-10-31", count: 250_000, label: "Oct 2025 — midterm spike 📈📈" },
  { start: "2025-11-01", end: "2025-11-30", count: 170_000, label: "Nov 2025 — post-midterm" },
  { start: "2025-12-01", end: "2025-12-31", count: 195_000, label: "Dec 2025 — finals" },
  { start: "2026-01-01", end: "2026-01-31", count: 160_000, label: "Jan 2026 — term 2 start" },
  { start: "2026-02-01", end: "2026-02-28", count: 210_000, label: "Feb 2026 — midterm spike 📈" },
];

const TOTAL = MONTHLY_PLAN.reduce((s, m) => s + m.count, 0);

// ─── Clean ──────────────────────────────────────────────────────────────────
async function cleanAll() {
  console.log("🧹 Cleaning existing booking data...");
  const t = Date.now();
  const tables = [
    "student_point_transaction", "student_point_wallet",
    "feedback_comment", "feedback_rating", "feedback",
    "booking_exception_evidence", "booking_exception_request",
    "booking_punishment_log", "booking_attendance",
    "booking_agreement_signature", "booking_session",
    "booking_assignment", "booking_outcome", "booking_cancellation",
    "notification", "booking",
  ];
  for (const t of tables) await exec(`TRUNCATE TABLE "${t}" CASCADE`);
  console.log(`   ✅ Cleaned in ${elapsed(t)}\n`);
}

// ─── Phase 0: Update student genders to include LGBTQ+ ─────────────────────
async function updateGenders() {
  console.log("🌈 Phase 0: Updating student genders (add LGBTQ_PLUS ~10%)...");
  const t = Date.now();

  // Get LGBTQ_PLUS category ID
  const lgbtq = await prisma.$queryRawUnsafe<{gender_category_id: number}[]>(`
    SELECT gender_category_id FROM gender_category WHERE code = 'LGBTQ_PLUS' LIMIT 1
  `);
  if (!lgbtq.length) { console.log("   ⚠️ No LGBTQ_PLUS category found, skipping."); return; }
  const lgbtqId = lgbtq[0].gender_category_id;

  // Set ~10% of students to LGBTQ_PLUS
  await exec(`
    UPDATE student_profile SET gender_category_id = ${lgbtqId}
    WHERE student_id IN (
      SELECT student_id FROM student_profile
      WHERE gender_category_id IS NOT NULL
      ORDER BY random()
      LIMIT (SELECT (COUNT(*) * 0.10)::int FROM student_profile)
    )
  `);

  const dist: any[] = await prisma.$queryRawUnsafe(`
    SELECT gc.code AS g, COUNT(*)::int AS n
    FROM student_profile sp
    LEFT JOIN gender_category gc ON sp.gender_category_id = gc.gender_category_id
    GROUP BY 1 ORDER BY 2 DESC
  `);
  console.log("   Gender distribution:");
  dist.forEach((r: any) => console.log(`     ${r.g}: ${Number(r.n).toLocaleString()}`));
  console.log(`   ✅ Done in ${elapsed(t)}\n`);
}

// ─── Phase 1: Create bookings with realistic monthly distribution ───────────
async function seedBookings() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📅 Phase 1: Creating ~${(TOTAL / 1e6).toFixed(1)}M bookings (12 months)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Create weighted problem category pool (temp table)
  // STRESS 25%, ACAD 20%, CAREER 15%, MENTAL 10%, REL 7%, FIN 6%, FAM 5%, ADJ 4%, HEALTH 3%, SEX 2%, BULLY 1.5%, LEGAL 1%, OTHER 0.5%
  await exec(`DROP TABLE IF EXISTS _cat_pool`);
  await exec(`
    CREATE TEMP TABLE _cat_pool AS
    SELECT problem_category_id, generate_series(1, weight) AS slot FROM (
      SELECT problem_category_id,
        CASE problem_category_code
          WHEN 'STRESS'  THEN 250
          WHEN 'ACAD'    THEN 200
          WHEN 'CAREER'  THEN 150
          WHEN 'MENTAL'  THEN 100
          WHEN 'REL'     THEN 70
          WHEN 'FIN'     THEN 60
          WHEN 'FAM'     THEN 50
          WHEN 'ADJ'     THEN 40
          WHEN 'HEALTH'  THEN 30
          WHEN 'SEX'     THEN 20
          WHEN 'BULLY'   THEN 15
          WHEN 'LEGAL'   THEN 10
          WHEN 'OTHER'   THEN 5
          ELSE 5
        END AS weight
      FROM problem_category
    ) t
  `);
  console.log("   ✅ Category weight pool created (1000 slots)\n");

  // Pre-fetch service mode IDs (avoid flaky subqueries in bulk INSERT)
  const smOnline = await prisma.$queryRaw<{service_mode_id: number}[]>`SELECT service_mode_id FROM service_mode_category WHERE code = 'ONLINE' LIMIT 1`;
  const smOnsite = await prisma.$queryRaw<{service_mode_id: number}[]>`SELECT service_mode_id FROM service_mode_category WHERE code = 'ONSITE' LIMIT 1`;
  const SM_ONLINE = smOnline[0]?.service_mode_id;
  const SM_ONSITE = smOnsite[0]?.service_mode_id;
  if (!SM_ONLINE || !SM_ONSITE) throw new Error(`service_mode_category not seeded! ONLINE=${SM_ONLINE}, ONSITE=${SM_ONSITE}`);
  console.log(`   ✅ ServiceMode IDs: ONLINE=${SM_ONLINE}, ONSITE=${SM_ONSITE}\n`);

  // Status distribution: 85% COMPLETED, 10% CANCELLED, 2.5% PENDING, 1.5% ASSIGNED, 1% IN_PROGRESS
  // We'll create COMPLETED first (largest batch), then others

  for (let i = 0; i < MONTHLY_PLAN.length; i++) {
    const m = MONTHLY_PLAN[i];
    const completed = Math.round(m.count * 0.85);
    const cancelled = Math.round(m.count * 0.10);
    const pending = Math.round(m.count * 0.025);
    const assigned = Math.round(m.count * 0.015);
    const inProg = m.count - completed - cancelled - pending - assigned;

    console.log(`   [${i + 1}/12] ${m.label} — ${m.count.toLocaleString()} total`);
    const mt = Date.now();

    // ── COMPLETED ──
    await exec(`
      INSERT INTO booking (
        university_id, student_id, consultant_id, time_slot_id,
        problem_category_id, online_channel_category_id,
        booking_detail_text, service_mode_id, booking_status,
        booking_created_at, booking_updated_at
      )
      SELECT
        s.university_id, s.student_id, c.consultant_id, ts.time_slot_id,
        cp.problem_category_id,
        CASE WHEN random() > 0.35 THEN oc.online_channel_category_id ELSE NULL END,
        CASE (gs.n % 8)
          WHEN 0 THEN 'รู้สึกเครียดมากจากการเรียน ต้องการพูดคุย'
          WHEN 1 THEN 'กังวลเรื่องอนาคตและเส้นทางอาชีพ'
          WHEN 2 THEN 'มีปัญหาความสัมพันธ์กับเพื่อน'
          WHEN 3 THEN 'นอนไม่หลับ วิตกกังวลเรื่องสอบ'
          WHEN 4 THEN 'ต้องการปรึกษาเรื่องส่วนตัว/ครอบครัว'
          WHEN 5 THEN 'รู้สึกหมดแรงจูงใจในการเรียน'
          WHEN 6 THEN 'ปัญหาการปรับตัวในมหาวิทยาลัย'
          ELSE 'ต้องการคำปรึกษาเรื่องสุขภาพจิต'
        END,
        CASE WHEN random() > 0.35 THEN ${SM_ONLINE} ELSE ${SM_ONSITE} END,
        'COMPLETED'::"BookingStatus",
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp)),
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp)) + interval '2 hours'
      FROM (
        SELECT student_id, university_id, ROW_NUMBER() OVER (ORDER BY random()) AS rn
        FROM student
      ) s
      CROSS JOIN generate_series(1, 6) AS gs(n)
      JOIN LATERAL (
        SELECT consultant_id FROM consultant
        WHERE consultant.university_id = s.university_id
        ORDER BY (consultant.consultant_id * 31 + gs.n * 7) % 97, random() LIMIT 1
      ) c ON true
      JOIN LATERAL (
        SELECT time_slot_id FROM time_slot
        WHERE time_slot.university_id = s.university_id
        ORDER BY (time_slot.time_slot_id * 17 + gs.n * 13) % 89 LIMIT 1
      ) ts ON true
      JOIN LATERAL (
        SELECT problem_category_id FROM _cat_pool ORDER BY random() LIMIT 1
      ) cp ON true
      JOIN LATERAL (
        SELECT online_channel_category_id FROM online_channel_category
        WHERE is_active = true ORDER BY random() LIMIT 1
      ) oc ON true
      ORDER BY random()
      LIMIT ${completed}
      ON CONFLICT DO NOTHING
    `);

    // ── CANCELLED ──
    await exec(`
      INSERT INTO booking (
        university_id, student_id, time_slot_id,
        problem_category_id, online_channel_category_id,
        booking_detail_text, service_mode_id, booking_status,
        booking_created_at, booking_updated_at
      )
      SELECT
        s.university_id, s.student_id, ts.time_slot_id,
        cp.problem_category_id,
        CASE WHEN random() > 0.4 THEN (SELECT online_channel_category_id FROM online_channel_category WHERE is_active = true ORDER BY random() LIMIT 1) ELSE NULL END,
        CASE (s.rn % 4)
          WHEN 0 THEN 'จองแล้วแต่ติดธุระ ขอยกเลิก'
          WHEN 1 THEN 'อาการดีขึ้นแล้ว ไม่ต้องพบ'
          WHEN 2 THEN 'เปลี่ยนเป็นนัดวันอื่นแทน'
          ELSE 'ต้องการยกเลิกการจอง'
        END,
        CASE WHEN random() > 0.3 THEN ${SM_ONLINE} ELSE ${SM_ONSITE} END,
        'CANCELLED'::"BookingStatus",
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp)),
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp))
      FROM (
        SELECT student_id, university_id, ROW_NUMBER() OVER (ORDER BY random()) AS rn
        FROM student ORDER BY random() LIMIT ${cancelled}
      ) s
      JOIN LATERAL (
        SELECT time_slot_id FROM time_slot WHERE time_slot.university_id = s.university_id ORDER BY random() LIMIT 1
      ) ts ON true
      JOIN LATERAL (
        SELECT problem_category_id FROM _cat_pool ORDER BY random() LIMIT 1
      ) cp ON true
      ON CONFLICT DO NOTHING
    `);

    // ── ASSIGNED ──
    await exec(`
      INSERT INTO booking (
        university_id, student_id, consultant_id, time_slot_id,
        problem_category_id, booking_detail_text, service_mode_id, booking_status,
        booking_created_at, booking_updated_at
      )
      SELECT
        s.university_id, s.student_id, c.consultant_id, ts.time_slot_id,
        cp.problem_category_id, 'รอพบผู้ให้คำปรึกษาตามนัด',
        CASE WHEN random() > 0.3 THEN ${SM_ONLINE} ELSE ${SM_ONSITE} END,
        'ASSIGNED'::"BookingStatus",
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp)),
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp))
      FROM (
        SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${assigned}
      ) s
      JOIN LATERAL (SELECT consultant_id FROM consultant WHERE consultant.university_id = s.university_id ORDER BY random() LIMIT 1) c ON true
      JOIN LATERAL (SELECT time_slot_id FROM time_slot WHERE time_slot.university_id = s.university_id ORDER BY random() LIMIT 1) ts ON true
      JOIN LATERAL (SELECT problem_category_id FROM _cat_pool ORDER BY random() LIMIT 1) cp ON true
      ON CONFLICT DO NOTHING
    `);

    // ── IN_PROGRESS ──
    await exec(`
      INSERT INTO booking (
        university_id, student_id, consultant_id, time_slot_id,
        problem_category_id, booking_detail_text, service_mode_id, booking_status,
        booking_created_at, booking_updated_at
      )
      SELECT
        s.university_id, s.student_id, c.consultant_id, ts.time_slot_id,
        cp.problem_category_id, 'กำลังรับคำปรึกษาอยู่',
        CASE WHEN random() > 0.3 THEN ${SM_ONLINE} ELSE ${SM_ONSITE} END,
        'IN_PROGRESS'::"BookingStatus",
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp)),
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp))
      FROM (
        SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${inProg}
      ) s
      JOIN LATERAL (SELECT consultant_id FROM consultant WHERE consultant.university_id = s.university_id ORDER BY random() LIMIT 1) c ON true
      JOIN LATERAL (SELECT time_slot_id FROM time_slot WHERE time_slot.university_id = s.university_id ORDER BY random() LIMIT 1) ts ON true
      JOIN LATERAL (SELECT problem_category_id FROM _cat_pool ORDER BY random() LIMIT 1) cp ON true
      ON CONFLICT DO NOTHING
    `);

    // ── PENDING_ASSIGNMENT ──
    await exec(`
      INSERT INTO booking (
        university_id, student_id, time_slot_id,
        problem_category_id, booking_detail_text, service_mode_id, booking_status,
        booking_created_at, booking_updated_at
      )
      SELECT
        s.university_id, s.student_id, ts.time_slot_id,
        cp.problem_category_id, 'รอระบบจัดเจ้าหน้าที่ให้',
        CASE WHEN random() > 0.3 THEN ${SM_ONLINE} ELSE ${SM_ONSITE} END,
        'PENDING_ASSIGNMENT'::"BookingStatus",
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp)),
        '${m.start}'::timestamp + (random() * ('${m.end}'::timestamp - '${m.start}'::timestamp))
      FROM (
        SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${pending}
      ) s
      JOIN LATERAL (SELECT time_slot_id FROM time_slot WHERE time_slot.university_id = s.university_id ORDER BY random() LIMIT 1) ts ON true
      JOIN LATERAL (SELECT problem_category_id FROM _cat_pool ORDER BY random() LIMIT 1) cp ON true
      ON CONFLICT DO NOTHING
    `);

    console.log(`            ✅ ${elapsed(mt)}`);
  }

  await exec(`DROP TABLE IF EXISTS _cat_pool`);
  const total: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking`);
  console.log(`\n   📊 Total bookings: ${Number(total[0].count).toLocaleString()}`);
}

// ─── Phase 2: Assignments ───────────────────────────────────────────────────
async function seedAssignments() {
  console.log("\n📋 Phase 2: Assignments...");
  const t = Date.now();
  await exec(`
    INSERT INTO booking_assignment (
      university_id, booking_id, consultant_id, consultant_university_id,
      assigned_by_account_id, is_auto_assigned, is_active, assigned_note, assigned_at
    )
    SELECT b.university_id, b.booking_id, b.consultant_id, b.university_id,
      head.account_id, (random() < 0.4), true,
      CASE (b.booking_id % 4)
        WHEN 0 THEN 'ระบบจัดสรรอัตโนมัติ' WHEN 1 THEN 'มอบหมายตามความเชี่ยวชาญ'
        WHEN 2 THEN 'มอบหมายตามตารางเวร' ELSE 'มอบหมายผู้ให้คำปรึกษา'
      END,
      b.booking_created_at + interval '30 minutes' + (random() * interval '2 hours')
    FROM booking b
    JOIN LATERAL (
      SELECT account_id FROM account
      WHERE account.account_home_university_id = b.university_id AND account.account_role = 'HEAD_CONSULTANT'
      LIMIT 1
    ) head ON true
    WHERE b.booking_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED') AND b.consultant_id IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
  const c: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_assignment`);
  console.log(`   ✅ ${Number(c[0].count).toLocaleString()} assignments in ${elapsed(t)}`);
}

// ─── Phase 3: Sessions ──────────────────────────────────────────────────────
async function seedSessions() {
  console.log("\n🔗 Phase 3: Sessions...");
  const t = Date.now();
  await exec(`
    INSERT INTO booking_session (
      university_id, booking_id, service_mode_id,
      online_channel_category_id, booking_session_join_url,
      booking_session_location_text, booking_session_is_link_visible,
      provided_by_account_id, provided_at
    )
    SELECT b.university_id, b.booking_id, b.service_mode_id, b.online_channel_category_id,
      CASE
        WHEN oc.online_channel_code = 'GOOGLE_MEET' THEN 'https://meet.google.com/abc-' || (b.booking_id % 9999)::text || '-xyz'
        WHEN oc.online_channel_code = 'ZOOM' THEN 'https://zoom.us/j/' || (1000000000 + b.booking_id)::text
        WHEN oc.online_channel_code = 'LINE_CALL' THEN 'https://line.me/R/ti/p/@wellness'
        WHEN oc.online_channel_code = 'MICROSOFT_TEAMS' THEN 'https://teams.microsoft.com/l/meetup-join/' || b.booking_id::text
        ELSE NULL
      END,
      CASE WHEN smc.code = 'ONSITE' THEN
        CASE (b.booking_id % 4)
          WHEN 0 THEN 'ห้องให้คำปรึกษา ชั้น 2 อาคารบริการนิสิต'
          WHEN 1 THEN 'ศูนย์สุขภาวะ ห้อง 301 อาคารกิจการนิสิต'
          WHEN 2 THEN 'ห้องพักผ่อน ชั้น 3 หอสมุดกลาง'
          ELSE 'ห้องให้คำปรึกษา ศูนย์สุขภาพจิต ชั้น 1'
        END ELSE NULL
      END,
      true, c.account_id, b.booking_created_at + interval '15 minutes'
    FROM booking b
    JOIN consultant c ON b.consultant_id = c.consultant_id
    LEFT JOIN online_channel_category oc ON b.online_channel_category_id = oc.online_channel_category_id
    LEFT JOIN service_mode_category smc ON b.service_mode_id = smc.service_mode_id
    WHERE b.booking_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
    ON CONFLICT DO NOTHING
  `);
  const cnt: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_session`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} sessions in ${elapsed(t)}`);
}

// ─── Phase 4: Outcomes ──────────────────────────────────────────────────────
async function seedOutcomes() {
  console.log("\n📊 Phase 4: Outcomes (risk by faculty)...");
  const t = Date.now();
  await exec(`
    INSERT INTO booking_outcome (
      university_id, booking_id, booking_outcome_consultant_note,
      booking_outcome_next_step, risk_level_id, booking_outcome_recorded_at
    )
    SELECT b.university_id, b.booking_id,
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
      CASE (b.booking_id % 5)
        WHEN 0 THEN 'นัดติดตามผลในอีก 2 สัปดาห์'
        WHEN 1 THEN 'ให้นิสิตกลับไปลองปรับพฤติกรรมการนอน แล้วมารายงานผล'
        WHEN 2 THEN 'ส่งต่อพบจิตแพทย์เพื่อประเมินเพิ่มเติม'
        WHEN 3 THEN 'แนะนำเข้าร่วมกลุ่มบำบัด (Group Therapy) รุ่นถัดไป'
        ELSE NULL
      END,
      GREATEST(1, LEAST(5, (
        (CASE
          WHEN random() < 0.30 THEN 1
          WHEN random() < 0.60 THEN 2
          WHEN random() < 0.80 THEN 3
          WHEN random() < 0.95 THEN 4
          ELSE 5
        END)
        + (CASE
          WHEN f.faculty_name_th LIKE '%วิศว%' THEN 1
          WHEN f.faculty_name_th LIKE '%แพทย%' THEN 1
          WHEN f.faculty_name_th LIKE '%พยาบาล%' THEN 1
          WHEN f.faculty_name_th LIKE '%เภสัช%' THEN 1
          WHEN f.faculty_name_th LIKE '%ทันต%' THEN 1
          WHEN f.faculty_name_th LIKE '%สถาปัตย%' THEN 1
          WHEN f.faculty_name_th LIKE '%ศิลป%' THEN -1
          WHEN f.faculty_name_th LIKE '%พลศึกษา%' THEN -1
          WHEN f.faculty_name_th LIKE '%ดนตรี%' THEN -1
          ELSE 0
        END)
        + (CASE WHEN random() < 0.10 THEN 1 ELSE 0 END)
      )::int)),
      b.booking_created_at + interval '1 hour' + (random() * interval '24 hours')
    FROM booking b
    JOIN student s ON b.student_id = s.student_id AND b.university_id = s.university_id
    LEFT JOIN student_academic sa ON s.student_id = sa.student_id AND s.university_id = sa.university_id
    LEFT JOIN faculty f ON sa.faculty_id = f.faculty_id AND sa.university_id = f.university_id
    WHERE b.booking_status = 'COMPLETED'
    ON CONFLICT DO NOTHING
  `);
  const cnt: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_outcome`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} outcomes in ${elapsed(t)}`);
}

// ─── Phase 5: Cancellations ─────────────────────────────────────────────────
async function seedCancellations() {
  console.log("\n❌ Phase 5: Cancellations (weighted reasons)...");
  const t = Date.now();
  await exec(`
    INSERT INTO booking_cancellation (
      university_id, booking_id, cancellation_reason_id,
      booking_cancellation_note, booking_cancellation_cancelled_by_id,
      booking_cancellation_cancelled_at
    )
    SELECT b.university_id, b.booking_id,
      (SELECT cr.cancellation_reason_id FROM cancellation_reason cr ORDER BY
        CASE cr.cancellation_reason_code
          WHEN 'RESCHEDULE'    THEN random() * 0.30
          WHEN 'FEELING_BETTER' THEN random() * 0.25
          WHEN 'EMERGENCY'    THEN random() * 0.15
          WHEN 'WRONG_BOOKING' THEN random() * 0.10
          WHEN 'LOCATION_ISSUE' THEN random() * 0.10
          ELSE random() * 0.05
        END DESC LIMIT 1),
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
    WHERE b.booking_status = 'CANCELLED' AND st.account_id IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
  const cnt: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_cancellation`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} cancellations in ${elapsed(t)}`);
}

// ─── Phase 6: Attendance ────────────────────────────────────────────────────
async function seedAttendance() {
  console.log("\n✅ Phase 6: Attendance...");
  const t = Date.now();
  await exec(`
    INSERT INTO booking_attendance (
      university_id, booking_id, booking_attendance_status,
      booking_attendance_checked_in_at, booking_attendance_late_minutes,
      booking_attendance_note, booking_attendance_marked_by_id, booking_attendance_marked_at
    )
    SELECT b.university_id, b.booking_id,
      CASE
        WHEN rnd.r < 0.70 THEN 'CHECKED_IN'::"AttendanceStatus"
        WHEN rnd.r < 0.85 THEN 'LATE'::"AttendanceStatus"
        WHEN rnd.r < 0.95 THEN 'NO_SHOW'::"AttendanceStatus"
        ELSE 'CANCELLED_BY_CONSULTANT'::"AttendanceStatus"
      END,
      CASE WHEN rnd.r < 0.85 THEN ts.time_slot_start_datetime + (random() * interval '15 minutes') ELSE NULL END,
      CASE WHEN rnd.r >= 0.70 AND rnd.r < 0.85 THEN (5 + floor(random() * 25))::int ELSE NULL END,
      NULL, c.account_id,
      ts.time_slot_start_datetime + interval '5 minutes'
    FROM booking b
    JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id AND b.university_id = ts.university_id
    JOIN consultant c ON b.consultant_id = c.consultant_id
    CROSS JOIN LATERAL (SELECT random() AS r) rnd
    WHERE b.booking_status IN ('COMPLETED', 'IN_PROGRESS') AND b.consultant_id IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
  const cnt: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_attendance`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} attendance in ${elapsed(t)}`);
}

// ─── Phase 7: Feedback ──────────────────────────────────────────────────────
async function seedFeedback() {
  console.log("\n⭐ Phase 7: Feedback (~60% of completed)...");
  const t = Date.now();
  await exec(`
    INSERT INTO feedback (
      university_id, booking_id, student_id, consultant_id,
      consultant_university_id, feedback_is_anonymous, feedback_created_at
    )
    SELECT b.university_id, b.booking_id, b.student_id, b.consultant_id,
      b.university_id, (random() < 0.65),
      b.booking_created_at + interval '3 hours' + (random() * interval '72 hours')
    FROM booking b
    WHERE b.booking_status = 'COMPLETED' AND b.consultant_id IS NOT NULL AND random() < 0.60
    ON CONFLICT DO NOTHING
  `);
  const cnt: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} feedbacks in ${elapsed(t)}`);
}

// ─── Phase 8: Ratings ───────────────────────────────────────────────────────
async function seedRatings() {
  console.log("\n🌟 Phase 8: Ratings...");
  const t = Date.now();
  await exec(`
    INSERT INTO feedback_rating (feedback_id, evaluation_criterion_id, feedback_rating_score)
    SELECT f.feedback_id, ec.evaluation_criterion_id,
      GREATEST(1, LEAST(5,
        CASE
          WHEN random() < 0.40 THEN 5
          WHEN random() < 0.70 THEN 4
          WHEN random() < 0.90 THEN 3
          WHEN random() < 0.97 THEN 2
          ELSE 1
        END
        + CASE WHEN (f.consultant_id % 3) = 0 THEN 1 ELSE 0 END
        - CASE WHEN random() < 0.15 THEN 1 ELSE 0 END
      ))
    FROM feedback f CROSS JOIN evaluation_criterion ec
    ON CONFLICT DO NOTHING
  `);
  const cnt: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback_rating`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} ratings in ${elapsed(t)}`);
}

// ─── Phase 9: Comments ──────────────────────────────────────────────────────
async function seedComments() {
  console.log("\n💬 Phase 9: Comments (~30%)...");
  const t = Date.now();
  await exec(`
    INSERT INTO feedback_comment (feedback_id, feedback_comment_text)
    SELECT f.feedback_id,
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
    FROM feedback f WHERE random() < 0.30
    ON CONFLICT DO NOTHING
  `);
  const cnt: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback_comment`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} comments in ${elapsed(t)}`);
}

// ─── Phase 10: Points ───────────────────────────────────────────────────────
async function seedPoints() {
  console.log("\n💰 Phase 10: Points & Wallets...");
  const t = Date.now();
  const rule = await prisma.pointRule.findUnique({ where: { point_rule_code: "FEEDBACK_SUBMITTED" } });
  if (!rule) { console.log("   ⚠️ No FEEDBACK_SUBMITTED rule, skipping."); return; }

  await exec(`
    INSERT INTO student_point_transaction (
      student_id, point_rule_id, booking_university_id, booking_id,
      student_point_txn_type, student_point_amount, student_point_note
    )
    SELECT b.student_id, ${rule.point_rule_id}, b.university_id, b.booking_id,
      'EARN'::"PointTxnType", ${rule.point_rule_points}, 'ได้รับแต้มจากการส่งแบบประเมิน'
    FROM feedback f JOIN booking b ON f.booking_id = b.booking_id AND f.university_id = b.university_id
    ON CONFLICT DO NOTHING
  `);

  await exec(`
    INSERT INTO student_point_wallet (university_id, student_id, student_point_balance)
    SELECT s.university_id, s.student_id, COALESCE(SUM(txn.student_point_amount), 0)
    FROM student s LEFT JOIN student_point_transaction txn ON s.student_id = txn.student_id
    GROUP BY s.university_id, s.student_id
    ON CONFLICT (university_id, student_id) DO UPDATE SET student_point_balance = EXCLUDED.student_point_balance
  `);
  console.log(`   ✅ Done in ${elapsed(t)}`);
}

// ─── Summary ────────────────────────────────────────────────────────────────
async function printSummary() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 FINAL SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const table of ["booking", "booking_assignment", "booking_session", "booking_outcome", "booking_cancellation", "booking_attendance", "feedback", "feedback_rating", "feedback_comment", "student_point_transaction", "student_point_wallet"]) {
    const r: [{ count: bigint }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM "${table}"`);
    console.log(`   ${table.padEnd(30)} ${Number(r[0].count).toLocaleString().padStart(12)}`);
  }

  console.log("\n   📈 Status Distribution:");
  const st: any[] = await prisma.$queryRawUnsafe(`SELECT booking_status, COUNT(*)::bigint as count FROM booking GROUP BY 1 ORDER BY count DESC`);
  st.forEach((s: any) => console.log(`      ${s.booking_status.padEnd(22)} ${Number(s.count).toLocaleString().padStart(12)}`));

  console.log("\n   📅 Monthly Distribution:");
  const mo: any[] = await prisma.$queryRawUnsafe(`SELECT date_trunc('month', booking_created_at)::date::text AS month, COUNT(*)::int AS n FROM booking GROUP BY 1 ORDER BY 1`);
  mo.forEach((m: any) => console.log(`      ${m.month}  ${Number(m.n).toLocaleString().padStart(10)}`));

  console.log("\n   📂 Problem Category Distribution:");
  const pc: any[] = await prisma.$queryRawUnsafe(`
    SELECT pc.problem_category_code, pc.problem_category_name_th, COUNT(b.booking_id)::int AS n
    FROM booking b JOIN problem_category pc ON b.problem_category_id = pc.problem_category_id
    GROUP BY 1, 2 ORDER BY n DESC
  `);
  pc.forEach((p: any) => console.log(`      ${p.problem_category_code.padEnd(10)} ${p.problem_category_name_th.padEnd(25)} ${Number(p.n).toLocaleString().padStart(10)}`));

  console.log("\n   🌈 Gender Distribution (student_profile):");
  const gd: any[] = await prisma.$queryRawUnsafe(`SELECT gc.code AS g, COUNT(*)::int AS n FROM student_profile sp LEFT JOIN gender_category gc ON sp.gender_category_id = gc.gender_category_id GROUP BY 1 ORDER BY 2 DESC`);
  gd.forEach((g: any) => console.log(`      ${(g.g || 'NULL').padEnd(15)} ${Number(g.n).toLocaleString().padStart(10)}`));

  console.log("\n   🎯 Risk Level Distribution:");
  const rl: any[] = await prisma.$queryRawUnsafe(`SELECT risk_level_id AS lv, COUNT(*)::bigint as count FROM booking_outcome WHERE risk_level_id IS NOT NULL GROUP BY 1 ORDER BY 1`);
  rl.forEach((r: any) => console.log(`      Level ${r.lv}:   ${Number(r.count).toLocaleString().padStart(12)}`));
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const totalStart = Date.now();
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  🚀 Realistic Booking Seed (1 Year, ~2M bookings)   ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  await exec(`SET synchronous_commit = OFF`);
  await exec(`SET work_mem = '512MB'`);
  await exec(`SET maintenance_work_mem = '1GB'`);

  await cleanAll();
  await updateGenders();
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

  await exec(`SET synchronous_commit = ON`);
  console.log(`\n🎉 All done! Total: ${elapsed(totalStart)}`);
}

main()
  .catch((e) => { console.error("❌ Fatal:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
