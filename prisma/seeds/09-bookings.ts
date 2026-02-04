// prisma/seeds/09-bookings.ts
import {
  PrismaClient,
  BookingStatus,
  TimeSlotStatus,
  PointTxnType,
  ServiceMode,
  OnlineChannel,
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
    pointRule: any;
    pointAmount: number;
    consultantBiasById: Map<number, number>;
    bookingPlan: { status: BookingStatus; count: number }[];

    // ✅ รองรับหลายมหาลัย: ส่งมาไม่ครบทุก code ได้
    cancelUniWeights?: Partial<Record<UniCode, number>>;
  },
) {
  console.log("📅 Creating bookings...");

  const {
    universities,
    students,
    consultants,
    timeSlotsByUniId,
    problemCategories,
    criteria,
    headAccountIdByUniversityId,
    tplCreated,
    tplAssigned,
    pointRule,
    pointAmount,
    consultantBiasById,
    bookingPlan,
    cancelUniWeights,
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

    // ✅ default bias (ยัง bias NU/CU/KKU ได้ แต่มหาลัยอื่นยังมีโอกาสด้วย)
    const completedWeights = makeWeightedMap(
      uniCodes,
      { NU: 60, CU: 30, KKU: 10 } as any,
      1,
    );
    const cancelledWeights = makeWeightedMap(
      uniCodes,
      { KKU: 60, NU: 30, CU: 10 } as any,
      1,
    );
    const neutralWeights = makeWeightedMap(
      uniCodes,
      { NU: 34, KKU: 33, CU: 33 } as any,
      1,
    );

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

  const pastFrom = addDays(today0, -90);
  const inProgressTo = addDays(today0, 7);
  const futureTo = addDays(today0, 14);

  const activeCountBySlotId = new Map<number, number>();

  // ✅ กันซ้ำ student+slot ในรอบ seed เดียวกัน (ป้องกันชน unique)
  const usedBookingTriples = new Set<string>();
  const tripleKey = (u: number, s: number, slotId: number) =>
    `${u}:${s}:${slotId}`;

  function pickSlotByStatus(uniId: number, status: BookingStatus) {
    const slots = timeSlotsByUniId.get(uniId) || [];
    const needCapacity = isActiveStatus(status);

    const candidates = slots.filter((s) => {
      if (s.time_slot_status !== TimeSlotStatus.OPEN) return false;

      const start = new Date(s.time_slot_start_datetime);

      if (
        status === BookingStatus.COMPLETED ||
        status === BookingStatus.CANCELLED
      ) {
        if (!(start >= pastFrom && start < today0)) return false;
      } else if (status === BookingStatus.IN_PROGRESS) {
        if (!(start >= today0 && start < inProgressTo)) return false;
      } else {
        if (!(start >= today0 && start < futureTo)) return false;
      }

      if (needCapacity) {
        const maxCap = Number(s.time_slot_max_capacity ?? 0);
        const used = activeCountBySlotId.get(s.time_slot_id) ?? 0;
        return maxCap > used;
      }
      return true;
    });

    if (candidates.length === 0) return null;
    return randomItem(candidates);
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

  // ------------------------------
  // main loop
  // ------------------------------
  for (const plan of bookingPlan) {
    const isCancelledPlan = plan.status === BookingStatus.CANCELLED;

    for (let i = 0; i < plan.count; i++) {
      const MAX_TRIES = 40;

      let booking: any = null;
      let student: any = null;
      let category: any = null;
      let slot: any = null;
      let slotStart: Date | null = null;
      let slotEnd: Date | null = null;
      let consultantId: number | null = null;
      let bookingCreatedAt: Date | null = null;

      // ✅ retry เพื่อเลี่ยงชน unique (u, student, slot)
      for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        student = pickStudentForStatus(plan.status);
        category = pickCategoryForUni(student.university_id);

        slot = pickSlotByStatus(student.university_id, plan.status);
        if (!slot) continue;

        const k = tripleKey(
          student.university_id,
          student.student_id,
          slot.time_slot_id,
        );
        if (usedBookingTriples.has(k)) continue;

        slotStart = new Date(slot.time_slot_start_datetime);
        slotEnd = new Date(slot.time_slot_end_datetime);

        consultantId = null;
        if (
          !isCancelledPlan &&
          plan.status !== BookingStatus.PENDING_ASSIGNMENT
        ) {
          const uniConsultants = consultants.filter(
            (c) => c.university_id === student.university_id,
          );
          if (uniConsultants.length === 0) continue;
          consultantId = randomItem(uniConsultants).consultant_id;
        }
        if (plan.status === BookingStatus.COMPLETED && !consultantId) continue;

        const maxLeadDays = plan.status === BookingStatus.COMPLETED ? 14 : 7;
        const minLeadDays = plan.status === BookingStatus.COMPLETED ? 1 : 0;

        bookingCreatedAt = randomDateBetween(
          addDays(slotStart, -maxLeadDays),
          addDays(slotStart, -minLeadDays),
        );
        bookingCreatedAt = addMinutes(bookingCreatedAt, randomInt(0, 59));

        const latestAllowedCreatedAt = addMinutes(slotStart, -10);
        if (bookingCreatedAt >= latestAllowedCreatedAt) {
          bookingCreatedAt = addMinutes(slotStart, -randomInt(10, 24 * 60));
        }

        try {
          const serviceMode =
            consultantId && plan.status !== BookingStatus.PENDING_ASSIGNMENT
              ? ServiceMode.ONLINE
              : ServiceMode.ONSITE;

          booking = await prisma.booking.create({
            data: {
              university_id: student.university_id,
              student_id: student.student_id,
              consultant_id: consultantId,
              time_slot_id: slot.time_slot_id,
              problem_category_id: category.problem_category_id,
              booking_detail_text: `รายละเอียดการขอรับคำปรึกษา - ${category.problem_category_name_th}`,
              booking_status: plan.status,
              booking_created_at: bookingCreatedAt,

              // ✅ required ตาม schema ใหม่
              booking_service_mode: serviceMode,

              // ✅ ใส่ให้ครบเวลาที่ ONLINE (optional แต่แนะนำ)
              booking_online_channel:
                serviceMode === ServiceMode.ONLINE
                  ? OnlineChannel.LINE_CALL
                  : null,
            },
          });

          usedBookingTriples.add(k);
          break;
        } catch (e: any) {
          if (e?.code === "P2002") continue;
          throw e;
        }
      }

      if (
        !booking ||
        !student ||
        !slot ||
        !slotStart ||
        !slotEnd ||
        !bookingCreatedAt
      ) {
        console.log(
          `⚠️  Skip booking: cannot find unique (uni,student,slot) after ${MAX_TRIES} tries. status=${plan.status}`,
        );
        continue;
      }

      // ------------------------------
      // active count (capacity control)
      // ------------------------------
      if (isActiveStatus(plan.status)) {
        activeCountBySlotId.set(
          slot.time_slot_id,
          (activeCountBySlotId.get(slot.time_slot_id) ?? 0) + 1,
        );
      }

      // ------------------------------
      // cancelled
      // ------------------------------
      if (isCancelledPlan) {
        const cancelMin = addMinutes(bookingCreatedAt, randomInt(5, 60));
        const cancelMaxCandidate = addHours(slotStart, -randomInt(1, 48));
        const cancelMaxHard = addMinutes(slotStart, -10);
        const cancelMax =
          cancelMaxCandidate < cancelMaxHard
            ? cancelMaxCandidate
            : cancelMaxHard;

        const cancelledAt =
          cancelMin < cancelMax
            ? randomDateBetween(cancelMin, cancelMax)
            : addMinutes(slotStart, -randomInt(10, 60));

        await prisma.bookingCancellation.create({
          data: {
            university_id: booking.university_id,
            booking_id: booking.booking_id,
            booking_cancellation_reason: "นักศึกษาไม่สามารถเข้ารับคำปรึกษาได้",
            booking_cancellation_cancelled_by_id: student.account_id,
            booking_cancellation_cancelled_at: cancelledAt,
          },
        });

        continue;
      }

      // ------------------------------
      // notifications
      // ------------------------------
      if (randomBool(0.7)) {
        const tplId =
          plan.status === BookingStatus.PENDING_ASSIGNMENT
            ? tplCreated.notification_template_id
            : tplAssigned.notification_template_id;

        await prisma.notification.create({
          data: {
            account_id: student.account_id,
            notification_template_id: tplId,
            university_id: booking.university_id,
            booking_id: booking.booking_id,
            notification_channel: "LINE",
            notification_data: {
              bookingId: booking.booking_id,
              status: plan.status,
            } as any,
            notification_status: randomBool(0.8) ? "SENT" : "PENDING",
            notification_sent_at: randomBool(0.8)
              ? addMinutes(bookingCreatedAt, randomInt(1, 30))
              : null,
          },
        });
      }

      // ------------------------------
      // assignment
      // ------------------------------
      if (consultantId) {
        const headAccountId =
          headAccountIdByUniversityId.get(booking.university_id) ?? null;

        if (headAccountId) {
          await prisma.bookingAssignment.create({
            data: {
              university_id: booking.university_id,
              booking_id: booking.booking_id,

              // ✅ schema ใหม่
              consultant_id: consultantId,
              consultant_university_id: booking.university_id, // consultant มาจาก uni เดียวกับ booking ใน seed นี้
              borrow_assignment_id: null,

              assigned_by_account_id: headAccountId,
              assigned_note: "มอบหมายผู้ให้คำปรึกษา",
              assigned_at: addMinutes(bookingCreatedAt, randomInt(1, 30)), // จะ now() ก็ได้
            },
          });
        }
      }

      // ------------------------------
      // completed extras
      // ------------------------------
      if (plan.status === BookingStatus.COMPLETED) {
        await prisma.bookingOutcome.create({
          data: {
            university_id: booking.university_id,
            booking_id: booking.booking_id,
            booking_outcome_consultant_note: `สรุปผล: ${category.problem_category_name_th} ...`,
            booking_outcome_next_step: randomBool()
              ? "นัดติดตามผลใน 2 สัปดาห์"
              : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
        });

        const feedback = await prisma.feedback.create({
          data: {
            university_id: booking.university_id,
            booking_id: booking.booking_id,
            student_id: booking.student_id,
            consultant_id: consultantId!,
            feedback_is_anonymous: randomBool(0.7),
          },
        });

        const bias = consultantBiasById.get(consultantId!) ?? 4.2;

        for (const cr of criteria) {
          await prisma.feedbackRating.create({
            data: {
              feedback_id: feedback.feedback_id,
              evaluation_criterion_id: cr.evaluation_criterion_id,
              feedback_rating_score: sampleRatingFromBias(bias),
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
            feedback_comment_replied_by_id: randomBool(0.3)
              ? headAccountId
              : null,
            feedback_comment_replied_at: randomBool(0.3)
              ? randomDateBetween(
                  addMinutes(slotEnd, 10),
                  addHours(slotEnd, 72),
                )
              : null,
          },
        });

        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            point_rule_id: pointRule.point_rule_id,
            booking_university_id: booking.university_id,
            booking_id: booking.booking_id,
            student_point_txn_type: PointTxnType.EARN,
            student_point_amount: pointAmount,
            student_point_note: "รับแต้มจากการเข้ารับคำปรึกษาสำเร็จ",
          },
        });

        await prisma.studentPointWallet.upsert({
          where: {
            university_id_student_id: {
              university_id: booking.university_id,
              student_id: booking.student_id,
            },
          },
          create: {
            university_id: booking.university_id,
            student_id: booking.student_id,
            student_point_balance: pointAmount,
          },
          update: {
            student_point_balance: { increment: pointAmount },
          },
        });
      }
    }
  }
}
