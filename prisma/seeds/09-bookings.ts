// prisma/seeds/09-bookings.ts
import {
  PrismaClient,
  BookingStatus,
  TimeSlotStatus,
  PointTxnType,
  ServiceMode,
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
  } = args;

  // ------------------------------
  // indexes
  // ------------------------------
  const studentsByUniId = new Map<number, any[]>();
  for (const s of students) {
    const arr = studentsByUniId.get(s.university_id) ?? [];
    arr.push(s);
    studentsByUniId.set(s.university_id, arr);
  }

  const uniCodes: UniCode[] = universities
    .map((u) => u.university_code as UniCode)
    .filter(Boolean);

  function uniIdByCode(code: UniCode) {
    const u = universities.find((x) => x.university_code === code);
    return u?.university_id ?? null;
  }

  // ------------------------------
  // helpers: weights
  // ------------------------------
  function normalizeUniWeights(
    weights: Partial<Record<UniCode, number>> | undefined,
    availableCodes: UniCode[],
  ): Record<UniCode, number> | null {
    if (!weights) return null;

    const filtered: Record<string, number> = {};
    for (const c of availableCodes) {
      const w = weights[c];
      if (typeof w === "number" && w > 0) filtered[c] = w;
    }

    // ถ้าไม่มีเลย -> ให้เท่ากันทุกมหาลัย
    if (Object.keys(filtered).length === 0) {
      for (const c of availableCodes) filtered[c] = 1;
    }

    return filtered as Record<UniCode, number>;
  }

  function makeWeightedMap(
    availableCodes: UniCode[],
    overrides: Partial<Record<UniCode, number>>,
    defaultWeight = 1,
  ): Record<UniCode, number> {
    const out: Record<string, number> = {};
    for (const c of availableCodes) out[c] = defaultWeight;

    for (const [k, v] of Object.entries(overrides)) {
      if (!availableCodes.includes(k as UniCode)) continue;
      if (typeof v === "number" && v > 0) out[k] = v;
    }
    return out as Record<UniCode, number>;
  }

  function pickUniCodeWeighted(
    availableCodes: UniCode[],
    weights?: Partial<Record<UniCode, number>>,
  ): UniCode {
    if (availableCodes.length === 0) {
      // fallback เผื่อ args.universities ว่างผิดปกติ
      return "NU" as UniCode;
    }

    const w = normalizeUniWeights(weights, availableCodes);
    if (!w) return randomItem(availableCodes);
    return pickWeightedKey<UniCode>(w);
  }

  // ------------------------------
  // pick student by status (multi-uni)
  // ------------------------------
  function pickStudentForStatus(status: BookingStatus) {
    // ✅ cancelled: ใช้ weight จาก args ถ้ามี
    if (status === BookingStatus.CANCELLED && cancelUniWeights) {
      const forcedUni = pickUniCodeWeighted(uniCodes, cancelUniWeights);
      const uid = uniIdByCode(forcedUni);
      const list = (uid ? studentsByUniId.get(uid) : null) ?? students;
      return randomItem(list);
    }

    // ✅ default bias: Use student population as base weight + some randomness
    // This ensures bigger universities get more bookings, but with variation.
    const baseWeights: Record<string, number> = {};
    for (const code of uniCodes) {
      const count = universityStudentCounts[code] ?? DEFAULT_STUDENT_COUNT;
      // Add +/- 20% noise to make it less perfectly linear
      const noise = 0.8 + Math.random() * 0.4; 
      baseWeights[code] = Math.ceil(count * noise);
    }

    const completedWeights = makeWeightedMap(uniCodes, baseWeights, 100);
    const cancelledWeights = makeWeightedMap(uniCodes, baseWeights, 100);
    const neutralWeights = makeWeightedMap(uniCodes, baseWeights, 100);

    const uniCode: UniCode =
      status === BookingStatus.COMPLETED
        ? pickWeightedKey<UniCode>(completedWeights)
        : status === BookingStatus.CANCELLED
          ? pickWeightedKey<UniCode>(cancelledWeights)
          : pickWeightedKey<UniCode>(neutralWeights);

    const uid = uniIdByCode(uniCode);
    const list = (uid ? studentsByUniId.get(uid) : null) ?? students;
    return randomItem(list);
  }

  function isActiveStatus(s: BookingStatus) {
    return (
      s === BookingStatus.PENDING_ASSIGNMENT ||
      s === BookingStatus.ASSIGNED ||
      s === BookingStatus.IN_PROGRESS
    );
  }

  const now = new Date();
  const today0 = startOfDay(now);

  const pastFrom = addDays(today0, -365); // ✅ 1 Year History
  const inProgressTo = addDays(today0, 7);
  const futureTo = addDays(today0, 14);

  const activeCountBySlotId = new Map<number, number>();

  // ✅ กันซ้ำ student+slot ในรอบ seed เดียวกัน (ป้องกันชน unique)
  const usedBookingTriples = new Set<string>();
  const tripleKey = (u: number, s: number, slotId: number) =>
    `${u}:${s}:${slotId}`;

  // ⚡ Optimization: Pre-filter slots by status groups to avoid repeated filtering in loop
  const slotsCache = new Map<string, any[]>();
  
  function getCachedSlots(uniId: number, timeframe: 'PAST' | 'PRESENT' | 'FUTURE') {
    const key = `${uniId}:${timeframe}`;
    if (slotsCache.has(key)) return slotsCache.get(key)!;

    const allSlots = rawTimeSlotsByUniId.get(uniId) || [];
    const filtered = allSlots.filter(s => {
      if (s.time_slot_status !== TimeSlotStatus.OPEN) return false;
      const start = new Date(s.time_slot_start_datetime);
      
      if (timeframe === 'PAST') return start >= pastFrom && start < today0;
      if (timeframe === 'PRESENT') return start >= today0 && start < inProgressTo;
      if (timeframe === 'FUTURE') return start >= today0 && start < futureTo;
      return false;
    });

    slotsCache.set(key, filtered);
    return filtered;
  }

  function pickSlotByStatus(uniId: number, status: BookingStatus) {
    let timeframe: 'PAST' | 'PRESENT' | 'FUTURE' = 'FUTURE';
    if (status === BookingStatus.COMPLETED || status === BookingStatus.CANCELLED) timeframe = 'PAST';
    else if (status === BookingStatus.IN_PROGRESS) timeframe = 'PRESENT';

    const candidates = getCachedSlots(uniId, timeframe);
    const needCapacity = isActiveStatus(status);

    if (candidates.length === 0) return null;

    if (!needCapacity) return randomItem(candidates);

    // Try picking random items first instead of filtering the whole array (which is O(N))
    for (let i = 0; i < 10; i++) {
        const s = randomItem(candidates);
        const maxCap = Number(s.time_slot_max_capacity ?? 0);
        const used = activeCountBySlotId.get(s.time_slot_id) ?? 0;
        if (maxCap > used) return s;
    }
    // Fallback
    const valid = candidates.filter(s => {
       const maxCap = Number(s.time_slot_max_capacity ?? 0);
       const used = activeCountBySlotId.get(s.time_slot_id) ?? 0;
       return maxCap > used;
    });
    
    return valid.length > 0 ? randomItem(valid) : null;
  }

  function pickCategoryForUni(universityId: number) {
    const uni = universities.find((u) => u.university_id === universityId);
    const uniCode = (uni?.university_code ?? "UNKNOWN") as UniCode;

    const mental = problemCategories.find(
      (c) => c.problem_category_code === "MENTAL",
    );
    const stress = problemCategories.find(
      (c) => c.problem_category_code === "STRESS",
    );

    if (!mental) return randomItem(problemCategories);

    const byUni: Partial<
      Record<UniCode, { MENTAL: number; STRESS: number; OTHER: number }>
    > = {
      NU: { MENTAL: 55, STRESS: 20, OTHER: 25 },
      CU: { MENTAL: 35, STRESS: 30, OTHER: 35 },
      KKU: { MENTAL: 25, STRESS: 35, OTHER: 40 },
    };

    const weights = byUni[uniCode] ?? { MENTAL: 30, STRESS: 25, OTHER: 45 };

    const roll = Math.random() * 100;
    if (roll < weights.MENTAL) return mental;
    if (roll < weights.MENTAL + weights.STRESS && stress) return stress;

    const others = problemCategories.filter(
      (c) =>
        c.problem_category_code !== "MENTAL" &&
        c.problem_category_code !== "STRESS",
    );
    return others.length ? randomItem(others) : randomItem(problemCategories);
  }

  function sampleRatingFromBias(bias: number) {
    const noise = (Math.random() - 0.5) * 0.9;
    const raw = bias + noise;
    return clamp(Math.round(raw), 1, 5);
  }

  // ⚡ BATCH MODE: Streaming insert (No huge arrays in RAM)
  const BOOKING_BATCH = 5000;
  
  console.log("   📦 Phase 1: Streaming bookings (Generate & Insert on-the-fly)...");

  let totalInserted = 0;
  const grandTotal = bookingPlan.reduce((s, p) => s + p.count, 0);

  // Store active counts to prevent overbooking slots
  // (This map size is manageable: ~500k slots * 8 bytes = ~4MB)
  
  for (const plan of bookingPlan) {
    let remaining = plan.count;
    const isCancelledPlan = plan.status === BookingStatus.CANCELLED;

    while (remaining > 0) {
      const currentBatchSize = Math.min(remaining, BOOKING_BATCH);
      const batchBookings: any[] = [];

      // Generate batch
      for (let i = 0; i < currentBatchSize; i++) {
        const MAX_TRIES = 40;
        let student: any = null;
        let category: any = null;
        let slot: any = null;
        let consultantId: number | null = null;
        let bookingCreatedAt: Date | null = null;

        for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
          student = pickStudentForStatus(plan.status);
          if (!student) continue;

          category = pickCategoryForUni(student.university_id);

          slot = pickSlotByStatus(student.university_id, plan.status);
          if (!slot) continue;

          // Optimization: Skip JS-side uniqueness check (tripleKey) to save RAM/CPU.
          // We rely on random distribution + Prisma 'skipDuplicates' to handle rare collisions.
          
          /* 
          const k = tripleKey(student.university_id, student.student_id, slot.time_slot_id);
          if (usedBookingTriples.has(k)) continue;
          */

          // Consultant logic
          if (!isCancelledPlan && plan.status !== BookingStatus.PENDING_ASSIGNMENT) {
            const uniConsultants = consultants.filter((c) => c.university_id === student.university_id);
            if (uniConsultants.length === 0) continue;
            consultantId = randomItem(uniConsultants).consultant_id;
          }
          if (plan.status === BookingStatus.COMPLETED && !consultantId) continue;

          // CreatedAt logic
          const slotStart = new Date(slot.time_slot_start_datetime);
          const maxLeadDays = plan.status === BookingStatus.COMPLETED ? 14 : 7;
          const minLeadDays = plan.status === BookingStatus.COMPLETED ? 1 : 0;
          
          bookingCreatedAt = randomDateBetween(
            addDays(slotStart, -maxLeadDays), 
            addDays(slotStart, -minLeadDays)
          );
          bookingCreatedAt = addMinutes(bookingCreatedAt, randomInt(0, 59));
          const latestAllowed = addMinutes(slotStart, -10);
          if (bookingCreatedAt >= latestAllowed) {
            bookingCreatedAt = addMinutes(slotStart, -randomInt(10, 24 * 60));
          }

          // Service Mode Case Mix
          // If assigned to a consultant, mix Online (~70%) and Onsite (~30%)
          let serviceMode: ServiceMode = ServiceMode.ONSITE;
          let channel = null;
          
          if (consultantId && plan.status !== BookingStatus.PENDING_ASSIGNMENT) {
            const isOnline = Math.random() < 0.7;
            serviceMode = isOnline ? ServiceMode.ONLINE : ServiceMode.ONSITE;
            
            if (isOnline) {
              // Diversify channels
              channel = randomItem(onlineChannels);
            }
          }

          // usedBookingTriples.add(k); <-- removed for optimization
          if (isActiveStatus(plan.status)) {
            activeCountBySlotId.set(slot.time_slot_id, (activeCountBySlotId.get(slot.time_slot_id) ?? 0) + 1);
          }

          const channelText = channel ? ` (ผ่าน ${channel.online_channel_name_th})` : "";
          batchBookings.push({
            university_id: student.university_id,
            student_id: student.student_id,
            consultant_id: consultantId,
            time_slot_id: slot.time_slot_id,
            problem_category_id: category.problem_category_id,
            booking_detail_text: `รายละเอียดการขอรับคำปรึกษา - ${category.problem_category_name_th}${channelText}`,
            booking_status: plan.status,
            booking_created_at: bookingCreatedAt,
            booking_service_mode: serviceMode,
            online_channel_category_id: channel?.online_channel_category_id ?? null,
          });

          break; // success
        }
      }

      if (batchBookings.length > 0) {
        await prisma.booking.createMany({
          data: batchBookings,
          skipDuplicates: true,
        });
        totalInserted += batchBookings.length;
      }
      
      remaining -= currentBatchSize;
      
      if (totalInserted % 10000 === 0) {
        console.log(`   ├─ Inserted: ${totalInserted} / ${grandTotal} (${Math.round(totalInserted/grandTotal*100)}%)`);
        // Periodic memory cleanup hint (optional)
        if (global.gc) global.gc();
      }
    }
  }

  console.log(`   ✅ Bookings seeded: ${totalInserted}`);
  console.log("   💾 Phase 2: Generating related records using SQL Set-Based operations...");

  // 1. Cancellations
  // logic: Cancelled bookings need a record.
  // reason: fixed string
  // cancelled_by: student
  // cancelled_at: ~1-48 hours before slot
  console.log("   📝 Generating Booking Cancellations (SQL)...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO booking_cancellation (
      university_id, booking_id, booking_cancellation_reason, 
      booking_cancellation_cancelled_by_id, booking_cancellation_cancelled_at
    )
    SELECT 
      b.university_id, 
      b.booking_id, 
      'นักศึกษาไม่สามารถเข้ารับคำปรึกษาได้',
      st.account_id,
      b.booking_created_at + interval '1 hour' -- Simplified time logic for SQL speed
    FROM booking b
    JOIN student st ON b.student_id = st.student_id
    WHERE b.booking_status = 'CANCELLED'
    ON CONFLICT DO NOTHING;
  `);

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
        WHEN oc.online_channel_code = 'GOOGLE_MEET' THEN 'https://meet.google.com/abc-' || round(random()*1000)::text || '-xyz'
        WHEN oc.online_channel_code = 'ZOOM' THEN 'https://zoom.us/j/' || round(random()*1000000000)::text
        WHEN oc.online_channel_code = 'LINE_CALL' THEN 'https://line.me/R/ti/p/@wellness_line'
        WHEN oc.online_channel_code = 'MICROSOFT_TEAMS' THEN 'https://teams.microsoft.com/l/meetup-join/dummy-' || b.booking_id::text
        ELSE NULL
      END as join_url,
      CASE 
        WHEN b.booking_service_mode = 'ONSITE' THEN 'ห้องให้คำปรึกษา ชั้น 2 อาคารบริการ (System Seed)'
        ELSE NULL
      END as location_text,
      true,
      c.account_id,
      b.booking_created_at + interval '10 minutes'
    FROM booking b
    JOIN consultant c ON b.consultant_id = c.consultant_id
    LEFT JOIN online_channel_category oc ON b.online_channel_category_id = oc.online_channel_category_id
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
      'สรุปผลการให้คำปรึกษา (Auto-generated)',
      CASE WHEN random() < 0.5 THEN 'นัดติดตามผล' ELSE NULL END,
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
