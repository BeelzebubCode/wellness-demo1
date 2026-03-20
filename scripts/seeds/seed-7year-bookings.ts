// scripts/seed-7year-bookings.ts — 7-Year Realistic Booking Data Generator (v4 — FULL)
// =========================================================================
// 🔥 5M bookings across 7 years (2019-2025) with ALL child tables:
//
// Booking Model Children (from Prisma schema):
//   1.  booking_assignment      — ทุก COMPLETED (has consultant)
//   2.  booking_cancellation    — ทุก CANCELLED
//   3.  booking_outcome         — ทุก COMPLETED
//   4.  booking_session         — ทุก COMPLETED (has session link/location)
//   5.  booking_agreement_signature — ทุก COMPLETED (student signed agreement)
//   6.  booking_attendance      — ทุก COMPLETED/CANCELLED
//   7.  booking_exception_request — 2% of NO_SHOW attendance
//   8.  discipline_log           — 5% of NO_SHOW cases
//   9.  feedback                — 80% of COMPLETED
//   10. feedback_rating         — ทุก feedback × criteria
//   11. feedback_comment        — 30% of feedback
//   12. student_point_transaction — ทุก feedback (EARN points)
//   13. student_point_wallet    — aggregate from transactions
//   14. notification            — ทุก booking (CREATED + ASSIGNED notifications)
// =========================================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 7-Year Booking Generator v4 — FULL (5M, SQL-only)\n');

  await prisma.$executeRawUnsafe(`SET synchronous_commit = OFF`);
  await prisma.$executeRawUnsafe(`SET work_mem = '2GB'`);
  await prisma.$executeRawUnsafe(`SET maintenance_work_mem = '2GB'`);
  console.log('⚡ Turbo mode ON\n');

  // ─── Step 0: TRUNCATE ──────────────────────────────────────
  console.log('🔥 Truncating all booking-related data...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE booking, booking_session, booking_assignment, booking_outcome,
             booking_cancellation, booking_attendance, booking_exception_request,
             booking_exception_evidence, discipline_log, 
             booking_agreement_signature,
             feedback, feedback_rating, feedback_comment,
             student_point_transaction, student_point_wallet,
             notification
    RESTART IDENTITY CASCADE;
  `);
  console.log('   ✅ Truncated\n');

  // ─── Step 1: TIME SLOTS (2019-2026) ────────────────────────
  console.log('⏰ Ensuring time slots (2019-2026)...');
  const t0 = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO time_slot (university_id, time_slot_start_datetime, time_slot_end_datetime, time_slot_max_capacity, time_slot_status)
    SELECT u.university_id, gs.s, gs.s + interval '1 hour', 4, 'OPEN'::"TimeSlotStatus"
    FROM university u
    CROSS JOIN LATERAL (
      SELECT generate_series('2019-01-01 01:00:00'::timestamptz, NOW(), interval '1 hour') AS s
    ) gs
    WHERE EXTRACT(HOUR FROM gs.s) BETWEEN 1 AND 12
    ON CONFLICT DO NOTHING;
  `);
  console.log(`   ✅ ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);

  // ─── Step 2: PROBLEM CATEGORY WEIGHTS ──────────────────────
  console.log('📋 Building _pc_weights...');
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS _pc_weights`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE _pc_weights AS
    WITH raw AS (
      SELECT problem_category_id, problem_category_code,
        CASE problem_category_code
          WHEN 'STRESS'  THEN 0.220
          WHEN 'ACAD'    THEN 0.180
          WHEN 'MENTAL'  THEN 0.150
          WHEN 'REL'     THEN 0.100
          WHEN 'FAM'     THEN 0.080
          WHEN 'CAREER'  THEN 0.070
          WHEN 'FIN'     THEN 0.050
          WHEN 'ADJ'     THEN 0.040
          WHEN 'HEALTH'  THEN 0.030
          WHEN 'SUBST'   THEN 0.025
          WHEN 'SEX'     THEN 0.020
          WHEN 'BULLY'   THEN 0.015
          WHEN 'LEGAL'   THEN 0.010
          WHEN 'OTHER'   THEN 0.010
          ELSE 0.005
        END AS w
      FROM problem_category
    )
    SELECT problem_category_id,
      COALESCE(SUM(w) OVER (ORDER BY w DESC ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS lo,
      SUM(w) OVER (ORDER BY w DESC) AS hi
    FROM raw;
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX idx_pcw ON _pc_weights (lo, hi)`);
  console.log('   ✅ Done\n');

  // ─── Step 3: GENERATE BOOKINGS (5M total) ──────────────────
  const yearlyPlan = [
    { year: 2019, completed: 255_000, cancelled: 30_000, pending: 0 },
    { year: 2020, completed: 382_000, cancelled: 45_000, pending: 0 },
    { year: 2021, completed: 467_000, cancelled: 55_000, pending: 0 },
    { year: 2022, completed: 552_000, cancelled: 65_000, pending: 0 },
    { year: 2023, completed: 680_000, cancelled: 80_000, pending: 0 },
    { year: 2024, completed: 850_000, cancelled: 100_000, pending: 0 },
    { year: 2025, completed: 1_020_000, cancelled: 120_000, pending: 0 },
    { year: 2026, completed: 170_000, cancelled: 20_000, pending: 15_000 }, // partial Jan-Feb 2026
  ];

  const overallStart = Date.now();

  for (const plan of yearlyPlan) {
    console.log(`\n━━━ 📅 YEAR ${plan.year} ━━━━━━━━━━━━━━━━━━`);
    const ys = `'${plan.year}-01-01'::timestamp`;
    // Cap year-end at NOW() - 1 day so no booking can be in the future
    const ye = `LEAST('${plan.year + 1}-01-01'::timestamp, NOW() - interval '1 day')`;

    // COMPLETED
    let t = Date.now();
    await prisma.$executeRawUnsafe(`
      INSERT INTO booking (
        university_id, student_id, consultant_id, time_slot_id, problem_category_id,
        online_channel_category_id, booking_detail_text, booking_service_mode,
        booking_status, booking_created_at
      )
      SELECT sub.university_id, sub.student_id, sub.consultant_id, sub.time_slot_id,
        (SELECT pw.problem_category_id FROM _pc_weights pw WHERE sub.rval >= pw.lo AND sub.rval < pw.hi LIMIT 1),
        sub.ocid, 'นัดหมายให้คำปรึกษา', sub.svc,
        'COMPLETED'::"BookingStatus", sub.cat
      FROM (
        SELECT s.university_id, s.student_id, c.consultant_id, ts.time_slot_id,
          random() AS rval,
          CASE WHEN random()>0.3 THEN (SELECT online_channel_category_id FROM online_channel_category ORDER BY random() LIMIT 1) ELSE NULL END AS ocid,
          CASE WHEN random()>0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END AS svc,
          ${ys} + (random() * (${ye} - ${ys})) AS cat
        FROM (SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${plan.completed}) s
        CROSS JOIN LATERAL (SELECT time_slot_id FROM time_slot WHERE time_slot.university_id=s.university_id AND time_slot_start_datetime>=${ys} AND time_slot_start_datetime<${ye} ORDER BY random() LIMIT 1) ts
        CROSS JOIN LATERAL (SELECT consultant_id FROM consultant WHERE consultant.university_id=s.university_id ORDER BY random() LIMIT 1) c
      ) sub ON CONFLICT DO NOTHING;
    `);
    console.log(`   ✅ COMPLETED ${plan.completed.toLocaleString()} in ${((Date.now() - t) / 1000).toFixed(0)}s`);

    // CANCELLED
    t = Date.now();
    await prisma.$executeRawUnsafe(`
      INSERT INTO booking (
        university_id, student_id, consultant_id, time_slot_id, problem_category_id,
        online_channel_category_id, booking_detail_text, booking_service_mode,
        booking_status, booking_created_at
      )
      SELECT sub.university_id, sub.student_id, NULL, sub.time_slot_id,
        (SELECT pw.problem_category_id FROM _pc_weights pw WHERE sub.rval >= pw.lo AND sub.rval < pw.hi LIMIT 1),
        sub.ocid, 'นัดหมาย (ยกเลิกแล้ว)', sub.svc,
        'CANCELLED'::"BookingStatus", sub.cat
      FROM (
        SELECT s.university_id, s.student_id, ts.time_slot_id, random() AS rval,
          CASE WHEN random()>0.3 THEN (SELECT online_channel_category_id FROM online_channel_category ORDER BY random() LIMIT 1) ELSE NULL END AS ocid,
          CASE WHEN random()>0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END AS svc,
          ${ys} + (random() * (${ye} - ${ys})) AS cat
        FROM (SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${plan.cancelled}) s
        CROSS JOIN LATERAL (SELECT time_slot_id FROM time_slot WHERE time_slot.university_id=s.university_id AND time_slot_start_datetime>=${ys} AND time_slot_start_datetime<${ye} ORDER BY random() LIMIT 1) ts
      ) sub ON CONFLICT DO NOTHING;
    `);
    console.log(`   ❌ CANCELLED ${plan.cancelled.toLocaleString()} in ${((Date.now() - t) / 1000).toFixed(0)}s`);

    // PENDING
    if (plan.pending > 0) {
      t = Date.now();
      await prisma.$executeRawUnsafe(`
        INSERT INTO booking (
          university_id, student_id, consultant_id, time_slot_id, problem_category_id,
          online_channel_category_id, booking_detail_text, booking_service_mode,
          booking_status, booking_created_at
        )
        SELECT sub.university_id, sub.student_id, NULL, sub.time_slot_id,
          (SELECT pw.problem_category_id FROM _pc_weights pw WHERE sub.rval >= pw.lo AND sub.rval < pw.hi LIMIT 1),
          sub.ocid, 'รอการจัดเจ้าหน้าที่', sub.svc,
          'PENDING_ASSIGNMENT'::"BookingStatus", sub.cat
        FROM (
          SELECT s.university_id, s.student_id, ts.time_slot_id, random() AS rval,
            CASE WHEN random()>0.3 THEN (SELECT online_channel_category_id FROM online_channel_category ORDER BY random() LIMIT 1) ELSE NULL END AS ocid,
            CASE WHEN random()>0.3 THEN 'ONLINE'::"ServiceMode" ELSE 'ONSITE'::"ServiceMode" END AS svc,
            ${ys} + (random() * (${ye} - ${ys})) AS cat
          FROM (SELECT student_id, university_id FROM student ORDER BY random() LIMIT ${plan.pending}) s
          CROSS JOIN LATERAL (SELECT time_slot_id FROM time_slot WHERE time_slot.university_id=s.university_id AND time_slot_start_datetime>=${ys} AND time_slot_start_datetime<${ye} ORDER BY random() LIMIT 1) ts
        ) sub ON CONFLICT DO NOTHING;
      `);
      console.log(`   ⏳ PENDING ${plan.pending.toLocaleString()} in ${((Date.now() - t) / 1000).toFixed(0)}s`);
    }
  }
  console.log(`\n🎉 Bookings: ${((Date.now() - overallStart) / 1000).toFixed(0)}s`);

  // ─── Step 4: ALL RELATED TABLES ────────────────────────────
  console.log('\n📝 Generating ALL related booking tables...\n');
  let t: number;

  // 4.1 booking_cancellation
  console.log('   [1/14] booking_cancellation...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_cancellation (university_id, booking_id, cancellation_reason_id,
      booking_cancellation_cancelled_by_id, booking_cancellation_cancelled_at)
    SELECT b.university_id, b.booking_id,
      (SELECT cancellation_reason_id FROM cancellation_reason ORDER BY random() LIMIT 1),
      st.account_id, b.booking_created_at + (random() * interval '2 days')
    FROM booking b JOIN student st ON b.student_id = st.student_id
    WHERE b.booking_status = 'CANCELLED' ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.2 booking_assignment
  console.log('   [2/14] booking_assignment...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_assignment (university_id, booking_id, consultant_id, consultant_university_id,
      assigned_by_account_id, assigned_note, assigned_at)
    SELECT b.university_id, b.booking_id, b.consultant_id, b.university_id,
      a.account_id, 'มอบหมายผู้ให้คำปรึกษา (auto)', b.booking_created_at + (random() * interval '1 day')
    FROM booking b
    LEFT JOIN LATERAL (SELECT account_id FROM account WHERE account_home_university_id = b.university_id AND account_role = 'HEAD_CONSULTANT' LIMIT 1) a ON TRUE
    WHERE b.booking_status = 'COMPLETED' AND b.consultant_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.3 booking_session
  console.log('   [3/14] booking_session...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_session (university_id, booking_id, booking_session_mode,
      online_channel_category_id, booking_session_join_url, booking_session_location_text,
      booking_session_is_link_visible, provided_by_account_id, provided_at)
    SELECT b.university_id, b.booking_id, b.booking_service_mode, b.online_channel_category_id,
      CASE WHEN b.booking_service_mode='ONLINE' THEN 'https://meet.google.com/abc-'||floor(random()*9999)::text ELSE NULL END,
      CASE WHEN b.booking_service_mode='ONSITE' THEN 'ห้องให้คำปรึกษา ชั้น '||floor(random()*5+1)::text ELSE NULL END,
      true, c.account_id, b.booking_created_at + (random() * interval '1 day')
    FROM booking b JOIN consultant c ON b.consultant_id=c.consultant_id
    WHERE b.booking_status='COMPLETED' ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.4 booking_outcome
  console.log('   [4/14] booking_outcome...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_outcome (university_id, booking_id, booking_outcome_consultant_note,
      booking_outcome_next_step, booking_outcome_risk_level)
    SELECT b.university_id, b.booking_id,
      CASE WHEN random()<0.2 THEN 'นิสิตมีความเครียดเรื่องการเรียน แนะนำเทคนิค Timeboxing'
           WHEN random()<0.4 THEN 'ปัญหาซึมเศร้าเล็กน้อย ให้คำปรึกษาเบื้องต้น'
           WHEN random()<0.6 THEN 'นิสิตมีปัญหาสัมพันธ์ แนะนำ Assertive Communication'
           WHEN random()<0.8 THEN 'กังวลเรื่องอนาคตการทำงาน แนะนำแหล่งฝึกงาน'
           ELSE 'รับฟังปัญหาทั่วไป แนะนำการดูแลสุขภาพ' END,
      CASE WHEN random()<0.3 THEN 'นัดติดตามผลอีก 2 สัปดาห์' ELSE NULL END,
      CASE WHEN pc.problem_category_code IN ('STRESS','MENTAL','BULLY','SUBST')
        THEN GREATEST(1,LEAST(5,floor(random()*3+3)::int))
        ELSE GREATEST(1,LEAST(5,floor(random()*3+1)::int)) END
    FROM booking b JOIN problem_category pc ON b.problem_category_id=pc.problem_category_id
    WHERE b.booking_status='COMPLETED' ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.5 booking_agreement_signature (ทุก COMPLETED — student signed agreement)
  console.log('   [5/14] booking_agreement_signature...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_agreement_signature (university_id, booking_id, student_id,
      signature_method, signature_payload)
    SELECT b.university_id, b.booking_id, b.student_id,
      'DRAW'::"ConsentSignatureMethod",
      '{"strokes":[],"timestamp":"auto-seed"}'::json
    FROM booking b
    WHERE b.booking_status = 'COMPLETED'
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.6 booking_attendance (ทุก COMPLETED = CHECKED_IN, some CANCELLED = NO_SHOW)
  console.log('   [6/14] booking_attendance...');
  t = Date.now();
  // COMPLETED → 90% CHECKED_IN, 8% LATE, 2% NO_SHOW
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_attendance (university_id, booking_id, booking_attendance_status,
      booking_attendance_checked_in_at, booking_attendance_late_minutes,
      booking_attendance_marked_by_id, booking_attendance_marked_at)
    SELECT b.university_id, b.booking_id,
      CASE WHEN random() < 0.90 THEN 'CHECKED_IN'::"AttendanceStatus"
           WHEN random() < 0.98 THEN 'LATE'::"AttendanceStatus"
           ELSE 'NO_SHOW'::"AttendanceStatus" END,
      CASE WHEN random() < 0.98 THEN ts.time_slot_start_datetime + (random() * interval '15 minutes') ELSE NULL END,
      CASE WHEN random() > 0.90 THEN floor(random() * 20 + 5)::int ELSE NULL END,
      c.account_id,
      ts.time_slot_start_datetime + (random() * interval '30 minutes')
    FROM booking b
    JOIN time_slot ts ON b.time_slot_id = ts.time_slot_id AND b.university_id = ts.university_id
    LEFT JOIN consultant c ON b.consultant_id = c.consultant_id
    WHERE b.booking_status = 'COMPLETED'
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.7 feedback (80% of COMPLETED)
  console.log('   [7/14] feedback...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO feedback (university_id, booking_id, student_id, consultant_id,
      consultant_university_id, feedback_is_anonymous, feedback_created_at)
    SELECT b.university_id, b.booking_id, b.student_id, b.consultant_id, b.university_id,
      (random()<0.7), b.booking_created_at + (random() * interval '7 days')
    FROM booking b
    WHERE b.booking_status='COMPLETED' AND b.consultant_id IS NOT NULL AND random()<0.8
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.8 feedback_rating
  console.log('   [8/14] feedback_rating...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO feedback_rating (feedback_id, evaluation_criterion_id, feedback_rating_score)
    SELECT f.feedback_id, c.evaluation_criterion_id,
      GREATEST(1,LEAST(5,floor(random()*2+4)::int))
    FROM feedback f CROSS JOIN evaluation_criterion c
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.9 feedback_comment (30%)
  console.log('   [9/14] feedback_comment...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO feedback_comment (feedback_id, feedback_comment_text)
    SELECT f.feedback_id,
      CASE WHEN random()<0.25 THEN 'ได้รับคำแนะนำที่ดีมาก ขอบคุณครับ/ค่ะ'
           WHEN random()<0.50 THEN 'พี่ที่ปรึกษาน่ารักมากค่ะ ช่วยได้เยอะเลย'
           WHEN random()<0.75 THEN 'รู้สึกดีขึ้นหลังจากคุยกับที่ปรึกษา'
           ELSE 'ขอบคุณที่รับฟังครับ ช่วยคลายกังวลได้มาก' END
    FROM feedback f WHERE random()<0.3 ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.10 student_point_transaction (EARN for feedback)
  console.log('   [10/14] student_point_transaction...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO student_point_transaction (student_id, point_rule_id,
      booking_university_id, booking_id,
      student_point_txn_type, student_point_amount, student_point_note)
    SELECT b.student_id,
      (SELECT point_rule_id FROM point_rule WHERE point_rule_code = 'FEEDBACK_SUBMITTED' LIMIT 1),
      b.university_id, b.booking_id,
      'EARN'::"PointTxnType",
      COALESCE((SELECT point_rule_points FROM point_rule WHERE point_rule_code = 'FEEDBACK_SUBMITTED' LIMIT 1), 10),
      'Auto reward for feedback'
    FROM booking b JOIN feedback f ON b.university_id=f.university_id AND b.booking_id=f.booking_id
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.11 student_point_wallet (aggregate)
  console.log('   [11/14] student_point_wallet...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO student_point_wallet (university_id, student_id, student_point_balance)
    SELECT s.university_id, s.student_id, COALESCE(SUM(txn.student_point_amount), 0)
    FROM student s
    LEFT JOIN student_point_transaction txn ON s.student_id = txn.student_id
    GROUP BY s.university_id, s.student_id
    ON CONFLICT (university_id, student_id) DO UPDATE SET student_point_balance = EXCLUDED.student_point_balance;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.12 notification (BOOKING_CREATED for each booking)
  console.log('   [12/14] notification...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO notification (account_id, notification_template_id,
      university_id, booking_id,
      notification_channel, notification_status, notification_sent_at, notification_created_at)
    SELECT st.account_id,
      (SELECT notification_template_id FROM notification_template LIMIT 1),
      b.university_id, b.booking_id,
      'LINE', 'SENT', b.booking_created_at + interval '1 minute', b.booking_created_at
    FROM booking b JOIN student st ON b.student_id = st.student_id
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.13 booking_exception_request (2% of NO_SHOW — students appeal)
  console.log('   [13/14] booking_exception_request...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_exception_request (university_id, booking_id, student_id,
      booking_exception_reason_code, booking_exception_reason_detail,
      booking_exception_status, booking_exception_requested_at)
    SELECT ba.university_id, ba.booking_id, b.student_id,
      'EMERGENCY', 'เหตุฉุกเฉินที่ไม่สามารถเข้าพบได้ (auto-seed)',
      CASE WHEN random()<0.6 THEN 'APPROVED'::"ExceptionStatus" ELSE 'REJECTED'::"ExceptionStatus" END,
      ts.time_slot_start_datetime + interval '1 day'
    FROM booking_attendance ba
    JOIN booking b ON ba.university_id=b.university_id AND ba.booking_id=b.booking_id
    JOIN time_slot ts ON b.university_id=ts.university_id AND b.time_slot_id=ts.time_slot_id
    WHERE ba.booking_attendance_status = 'NO_SHOW' AND random() < 0.3
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // 4.14 discipline_log (NO_SHOW penalties)
  console.log('   [14/14] discipline_log...');
  t = Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO discipline_log (university_id, student_id, booking_id,
      action_type_code,
      note, created_at)
    SELECT ba.university_id, b.student_id, ba.booking_id,
      'NO_SHOW',
      'ลงโทษจากการไม่มาตามนัด (auto-seed)',
      ts.time_slot_start_datetime + interval '2 days'
    FROM booking_attendance ba
    JOIN booking b ON ba.university_id=b.university_id AND ba.booking_id=b.booking_id
    JOIN time_slot ts ON b.university_id=ts.university_id AND b.time_slot_id=ts.time_slot_id
    WHERE ba.booking_attendance_status = 'NO_SHOW'
    ON CONFLICT DO NOTHING;
  `);
  console.log(`         ${((Date.now() - t) / 1000).toFixed(0)}s`);

  // Cleanup
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS _pc_weights`);

  console.log(`\n✅ COMPLETE! Total: ${((Date.now() - overallStart) / 1000).toFixed(0)}s`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
