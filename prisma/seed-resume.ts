// prisma/seed-resume.ts
// Resume from Phase 3 (Sessions) — bookings + assignments already done

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function elapsed(start: number): string {
  return ((Date.now() - start) / 1000).toFixed(1) + "s";
}
async function exec(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

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
  const cnt: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_session`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} sessions in ${elapsed(t)}`);
}

async function seedOutcomes() {
  console.log("\n📊 Phase 4: Outcomes...");
  const t = Date.now();
  await exec(`
    INSERT INTO booking_outcome (
      university_id, booking_id, booking_outcome_consultant_note,
      booking_outcome_next_step, booking_outcome_risk_level, booking_outcome_recorded_at
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
  const cnt: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_outcome`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} outcomes in ${elapsed(t)}`);
}

async function seedCancellations() {
  console.log("\n❌ Phase 5: Cancellations...");
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
          WHEN 'RESCHEDULE'     THEN random() * 0.30
          WHEN 'FEELING_BETTER' THEN random() * 0.25
          WHEN 'EMERGENCY'      THEN random() * 0.15
          WHEN 'WRONG_BOOKING'  THEN random() * 0.10
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
  const cnt: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_cancellation`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} cancellations in ${elapsed(t)}`);
}

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
  const cnt: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM booking_attendance`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} attendance in ${elapsed(t)}`);
}

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
  const cnt: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} feedbacks in ${elapsed(t)}`);
}

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
  const cnt: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback_rating`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} ratings in ${elapsed(t)}`);
}

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
  const cnt: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM feedback_comment`);
  console.log(`   ✅ ${Number(cnt[0].count).toLocaleString()} comments in ${elapsed(t)}`);
}

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

async function printSummary() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 FINAL SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const table of ["booking","booking_assignment","booking_session","booking_outcome","booking_cancellation","booking_attendance","feedback","feedback_rating","feedback_comment","student_point_transaction","student_point_wallet"]) {
    const r: [{count: bigint}] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as count FROM "${table}"`);
    console.log(`   ${table.padEnd(30)} ${Number(r[0].count).toLocaleString().padStart(12)}`);
  }

  console.log("\n   📈 Status Distribution:");
  const st: {booking_status: string; count: bigint}[] = await prisma.$queryRawUnsafe(`SELECT booking_status, COUNT(*)::bigint as count FROM booking GROUP BY 1 ORDER BY count DESC`);
  st.forEach(s => console.log(`      ${s.booking_status.padEnd(22)} ${Number(s.count).toLocaleString().padStart(12)}`));

  console.log("\n   📅 Monthly Distribution:");
  const mo: {month: string; n: number}[] = await prisma.$queryRawUnsafe(`SELECT date_trunc('month', booking_created_at)::date::text AS month, COUNT(*)::int AS n FROM booking GROUP BY 1 ORDER BY 1`);
  mo.forEach(m => console.log(`      ${m.month}  ${Number(m.n).toLocaleString().padStart(10)}`));

  console.log("\n   📂 Problem Category Distribution:");
  const pc: {problem_category_code: string; problem_category_name_th: string; n: number}[] = await prisma.$queryRawUnsafe(`
    SELECT pc.problem_category_code, pc.problem_category_name_th, COUNT(b.booking_id)::int AS n
    FROM booking b JOIN problem_category pc ON b.problem_category_id = pc.problem_category_id
    GROUP BY 1, 2 ORDER BY n DESC
  `);
  pc.forEach(p => console.log(`      ${p.problem_category_code.padEnd(10)} ${p.problem_category_name_th.padEnd(25)} ${Number(p.n).toLocaleString().padStart(10)}`));

  console.log("\n   🌈 Gender Distribution:");
  const gd: {g: string; n: number}[] = await prisma.$queryRawUnsafe(`SELECT gc.code AS g, COUNT(*)::int AS n FROM student_profile sp LEFT JOIN gender_category gc ON sp.gender_category_id = gc.gender_category_id GROUP BY 1 ORDER BY 2 DESC`);
  gd.forEach(g => console.log(`      ${(g.g || 'NULL').padEnd(15)} ${Number(g.n).toLocaleString().padStart(10)}`));
}

async function main() {
  const totalStart = Date.now();
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  ▶️  Resume from Phase 3 (Sessions)                  ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  await exec(`SET synchronous_commit = OFF`);
  await exec(`SET work_mem = '512MB'`);
  await exec(`SET maintenance_work_mem = '1GB'`);

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
  console.log(`\n🎉 Done! Total: ${elapsed(totalStart)}`);
}

main()
  .catch(e => { console.error("❌ Fatal:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
