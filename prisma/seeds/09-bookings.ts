// prisma/seeds/09-bookings.ts
import {
  PrismaClient,
  BookingStatus,
  TimeSlotStatus,
  PointTxnType,
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

type UniCode = "NU" | "KKU" | "CU";

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

    // ✅ เพิ่ม: คุมสัดส่วน cancelled ตามมหาลัย
    cancelUniWeights?: Record<UniCode, number>;
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

  function uniIdByCode(code: UniCode) {
    const u = universities.find((x) => x.university_code === code);
    return u?.university_id ?? null;
  }

  function pickStudentForStatus(status: BookingStatus) {
    // ✅ ถ้าต้องการให้ cancelled กระจุกที่ KKU มากสุด
    if (status === BookingStatus.CANCELLED && cancelUniWeights) {
      const forcedUni = pickWeightedKey<UniCode>(cancelUniWeights);
      const uid = uniIdByCode(forcedUni);
      const list = (uid ? studentsByUniId.get(uid) : null) ?? students;
      return randomItem(list);
    }

    // default behavior (เดิมของคุณ)
    const uniCode: UniCode =
      status === BookingStatus.COMPLETED
        ? pickWeightedKey<UniCode>({ NU: 60, CU: 30, KKU: 10 })
        : status === BookingStatus.CANCELLED
          ? pickWeightedKey<UniCode>({ KKU: 60, NU: 30, CU: 10 })
          : pickWeightedKey<UniCode>({ NU: 34, KKU: 33, CU: 33 });

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

  function pickSlotByStatus(uniId: number, status: BookingStatus) {
    const slots = timeSlotsByUniId.get(uniId) || [];
    const needCapacity = isActiveStatus(status);

    const candidates = slots.filter((s) => {
      if (s.time_slot_status !== TimeSlotStatus.AVAILABLE) return false;

      const start = new Date(s.time_slot_start_datetime);

      if (status === BookingStatus.COMPLETED || status === BookingStatus.CANCELLED) {
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
    const uniCode = uni?.university_code ?? "UNKNOWN";

    const mental = problemCategories.find((c) => c.problem_category_code === "MENTAL");
    const stress = problemCategories.find((c) => c.problem_category_code === "STRESS");

    if (!mental) return randomItem(problemCategories);

    const weights =
      uniCode === "NU"
        ? { MENTAL: 55, STRESS: 20, OTHER: 25 }
        : { MENTAL: 20, STRESS: 25, OTHER: 55 };

    const roll = Math.random() * 100;
    if (roll < weights.MENTAL) return mental;
    if (roll < weights.MENTAL + weights.STRESS && stress) return stress;

    const others = problemCategories.filter(
      (c) => c.problem_category_code !== "MENTAL" && c.problem_category_code !== "STRESS",
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
      const student = pickStudentForStatus(plan.status);
      const category = pickCategoryForUni(student.university_id);

      const slot = pickSlotByStatus(student.university_id, plan.status);
      if (!slot) {
        console.log(`⚠️  No suitable slot for status=${plan.status} uni=${student.university_id}`);
        continue;
      }

      const slotStart = new Date(slot.time_slot_start_datetime);
      const slotEnd = new Date(slot.time_slot_end_datetime);

      let consultantId: number | null = null;
      if (!isCancelledPlan && plan.status !== BookingStatus.PENDING_ASSIGNMENT) {
        const uniConsultants = consultants.filter((c) => c.university_id === student.university_id);
        if (uniConsultants.length === 0) continue;
        consultantId = randomItem(uniConsultants).consultant_id;
      }
      if (plan.status === BookingStatus.COMPLETED && !consultantId) continue;

      const maxLeadDays = plan.status === BookingStatus.COMPLETED ? 14 : 7;
      const minLeadDays = plan.status === BookingStatus.COMPLETED ? 1 : 0;

      let bookingCreatedAt = randomDateBetween(
        addDays(slotStart, -maxLeadDays),
        addDays(slotStart, -minLeadDays),
      );
      bookingCreatedAt = addMinutes(bookingCreatedAt, randomInt(0, 59));

      const latestAllowedCreatedAt = addMinutes(slotStart, -10);
      if (bookingCreatedAt >= latestAllowedCreatedAt) {
        bookingCreatedAt = addMinutes(slotStart, -randomInt(10, 24 * 60));
      }

      const booking = await prisma.booking.create({
        data: {
          university_id: student.university_id,
          student_id: student.student_id,
          consultant_id: consultantId,
          time_slot_id: slot.time_slot_id,
          problem_category_id: category.problem_category_id,
          booking_detail_text: `รายละเอียดการขอรับคำปรึกษา - ${category.problem_category_name_th}`,
          booking_status: plan.status,
          booking_created_at: bookingCreatedAt,
        },
      });

      if (isActiveStatus(plan.status)) {
        activeCountBySlotId.set(
          slot.time_slot_id,
          (activeCountBySlotId.get(slot.time_slot_id) ?? 0) + 1,
        );
      }

      if (isCancelledPlan) {
        const cancelMin = addMinutes(bookingCreatedAt, randomInt(5, 60));
        const cancelMaxCandidate = addHours(slotStart, -randomInt(1, 48));
        const cancelMaxHard = addMinutes(slotStart, -10);
        const cancelMax = cancelMaxCandidate < cancelMaxHard ? cancelMaxCandidate : cancelMaxHard;

        const cancelledAt =
          cancelMin < cancelMax
            ? randomDateBetween(cancelMin, cancelMax)
            : addMinutes(slotStart, -randomInt(10, 60));

        await prisma.bookingCancellation.create({
          data: {
            booking_id: booking.booking_id,
            booking_cancellation_reason: "นักศึกษาไม่สามารถเข้ารับคำปรึกษาได้",
            booking_cancellation_cancelled_by_id: student.account_id,
            booking_cancellation_cancelled_at: cancelledAt,
          },
        });
        continue;
      }

      if (randomBool(0.7)) {
        const tplId =
          plan.status === BookingStatus.PENDING_ASSIGNMENT
            ? tplCreated.notification_template_id
            : tplAssigned.notification_template_id;

        await prisma.notification.create({
          data: {
            account_id: student.account_id,
            notification_template_id: tplId,
            booking_id: booking.booking_id,
            notification_channel: "LINE",
            notification_data: { bookingId: booking.booking_id, status: plan.status } as any,
            notification_status: randomBool(0.8) ? "SENT" : "PENDING",
            notification_sent_at: randomBool(0.8)
              ? addMinutes(bookingCreatedAt, randomInt(1, 30))
              : null,
          },
        });
      }

      if (consultantId) {
        const headAccountId = headAccountIdByUniversityId.get(booking.university_id) ?? null;
        if (headAccountId) {
          await prisma.bookingAssignment.create({
            data: {
              booking_id: booking.booking_id,
              booking_assignment_assigned_by_id: headAccountId,
              booking_assignment_assigned_to_id: consultantId,
              booking_assignment_note: "มอบหมายผู้ให้คำปรึกษา",
            },
          });
        }
      }

      if (plan.status === BookingStatus.COMPLETED) {
        await prisma.bookingOutcome.create({
          data: {
            booking_id: booking.booking_id,
            booking_outcome_consultant_note: `สรุปผล: ${category.problem_category_name_th} - นักศึกษาได้รับคำแนะนำและมีแนวทางในการแก้ไขปัญหา`,
            booking_outcome_next_step: randomBool() ? "นัดติดตามผลใน 2 สัปดาห์" : null,
            booking_outcome_risk_level: randomInt(1, 3),
          },
        });

        const feedback = await prisma.feedback.create({
          data: {
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

        const headAccountId = headAccountIdByUniversityId.get(booking.university_id) ?? null;

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
            feedback_comment_replied_by_id: randomBool(0.3) ? headAccountId : null,
            feedback_comment_replied_at: randomBool(0.3)
              ? randomDateBetween(addMinutes(slotEnd, 10), addHours(slotEnd, 72))
              : null,
          },
        });

        await prisma.studentPointTransaction.create({
          data: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: pointRule.point_rule_id,
            student_point_txn_type: PointTxnType.EARN,
            student_point_amount: pointAmount,
            student_point_note: "รับแต้มจากการเข้ารับคำปรึกษาสำเร็จ",
          },
        });

        await prisma.studentPointWallet.upsert({
          where: { student_id: booking.student_id },
          create: { student_id: booking.student_id, student_point_balance: pointAmount },
          update: { student_point_balance: { increment: pointAmount } },
        });
      }
    }
  }
}
