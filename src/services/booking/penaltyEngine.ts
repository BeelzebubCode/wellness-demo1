// src/services/booking/penaltyEngine.ts
/**
 * Penalty Engine — Exception & Attendance System
 *
 * All operations run inside a passed Prisma transaction (Tx) to ensure atomicity.
 *
 * Business Rules:
 *  LATE_CANCEL: count >= 3 → lock +7 days, deduct 20 points
 *  NO_SHOW ×1:  count >= 1 → lock +7 days, deduct 30 points
 *  NO_SHOW ×2+: count >= 2 → lock +14 days, deduct 30 points
 */
import { Prisma, DisciplineEventType } from "@prisma/client";

type Tx = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type PenaltyCtx = {
  universityId: number;
  studentId: number;
  bookingId: number;
  actorAccountId?: number; // consultant / system
};

type RollbackCtx = {
  universityId: number;
  studentId: number;
  exceptionRequestId: number;
  actorAccountId?: number;
};

// ─── upsert trust status ──────────────────────────────────────────────────────
async function getOrCreateTrust(tx: Tx, universityId: number, studentId: number) {
  return tx.studentBehaviorStatus.upsert({
    where: { university_id_student_id: { university_id: universityId, student_id: studentId } },
    create: { university_id: universityId, student_id: studentId },
    update: {},
  });
}

// ─── deduct points + update wallet ──────────────────────────────────────────
async function deductPoints(
  tx: Tx,
  studentId: number,
  universityId: number,
  bookingId: number,
  ruleCode: string,
  amount: number, // positive number — will be stored as negative
) {
  const rule = await tx.pointRule.findUnique({ where: { point_rule_code: ruleCode } });
  if (!rule) return;

  await tx.studentPointTransaction.create({
    data: {
      student_id: studentId,
      point_rule_id: rule.point_rule_id,
      booking_university_id: universityId,
      booking_id: bookingId,
      student_point_txn_type: "ADJUST",
      student_point_amount: -amount,
      student_point_note: `ระบบหักแต้มอัตโนมัติ: ${rule.point_rule_name_th}`,
    },
  });

  await tx.studentPointWallet.upsert({
    where: { university_id_student_id: { university_id: universityId, student_id: studentId } },
    create: { university_id: universityId, student_id: studentId, student_point_balance: -amount },
    update: { student_point_balance: { increment: -amount } },
  });
}

// ─── restore points ────────────────────────────────────────────────────────────
async function restorePoints(
  tx: Tx,
  studentId: number,
  universityId: number,
  amount: number,
) {
  const rule = await tx.pointRule.findUnique({ where: { point_rule_code: "EXCEPTION_REFUND" } });

  await tx.studentPointTransaction.create({
    data: {
      student_id: studentId,
      point_rule_id: rule?.point_rule_id ?? null,
      student_point_txn_type: "ADJUST",
      student_point_amount: amount,
      student_point_note: "คืนแต้มจากการอนุมัติยกเว้นโทษ",
    },
  });

  await tx.studentPointWallet.upsert({
    where: { university_id_student_id: { university_id: universityId, student_id: studentId } },
    create: { university_id: universityId, student_id: studentId, student_point_balance: amount },
    update: { student_point_balance: { increment: amount } },
  });
}

// ─── log ──────────────────────────────────────────────────────────────────────
async function writeDisciplineLog(
  tx: Tx,
  data: {
    universityId: number;
    studentId: number;
    bookingId?: number;
    eventType: DisciplineEventType;
    deltaScore?: number;
    deltaPoints?: number;
    lockUntil?: Date | null;
    note?: string;
    createdById?: number;
  },
) {
  await tx.bookingPunishmentLog.create({
    data: {
      university_id: data.universityId,
      student_id: data.studentId,
      booking_id: data.bookingId ?? null,
      booking_discipline_event_type: data.eventType,
      booking_discipline_delta_score: data.deltaScore ?? null,
      booking_discipline_delta_points: data.deltaPoints ?? null,
      booking_discipline_lock_until: data.lockUntil ?? null,
      booking_discipline_note: data.note ?? null,
      booking_discipline_created_by_id: data.createdById ?? null,
    },
  });
}

// ─── lock helper ─────────────────────────────────────────────────────────────
function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply penalty for late cancellation (>= 3 times triggers lock + point deduction)
 */
export async function applyLateCancelPenalty(tx: Tx, ctx: PenaltyCtx) {
  const trust = await getOrCreateTrust(tx, ctx.universityId, ctx.studentId);

  const newCount = trust.student_trust_late_cancel_count + 1;

  // Determine if lock & point deduction should trigger
  const shouldPenalize = newCount >= 3 && newCount % 3 === 0; // every 3rd offence
  const lockUntil = shouldPenalize ? addDays(7) : trust.student_trust_locked_until;

  await tx.studentBehaviorStatus.update({
    where: { university_id_student_id: { university_id: ctx.universityId, student_id: ctx.studentId } },
    data: {
      student_trust_late_cancel_count: newCount,
      student_trust_locked_until: shouldPenalize ? lockUntil : undefined,
    },
  });

  if (shouldPenalize) {
    await deductPoints(tx, ctx.studentId, ctx.universityId, ctx.bookingId, "LATE_CANCEL_PENALTY", 20);
    await writeDisciplineLog(tx, {
      universityId: ctx.universityId,
      studentId: ctx.studentId,
      bookingId: ctx.bookingId,
      eventType: "LATE_CANCEL_PENALTY",
      deltaPoints: -20,
      lockUntil,
      note: `ยกเลิกกะทันหันครั้งที่ ${newCount}`,
      createdById: ctx.actorAccountId,
    });
  }
}

/**
 * Apply penalty for no-show
 * 1st  offence → lock 7 days,  deduct 30 pts
 * 2nd+ offence → lock 14 days, deduct 30 pts
 */
export async function applyNoShowPenalty(tx: Tx, ctx: PenaltyCtx) {
  const trust = await getOrCreateTrust(tx, ctx.universityId, ctx.studentId);

  const newCount = trust.student_trust_no_show_count + 1;
  const lockDays = newCount >= 2 ? 14 : 7;
  const lockUntil = addDays(lockDays);

  await tx.studentBehaviorStatus.update({
    where: { university_id_student_id: { university_id: ctx.universityId, student_id: ctx.studentId } },
    data: {
      student_trust_no_show_count: newCount,
      student_trust_locked_until: lockUntil,
    },
  });

  await deductPoints(tx, ctx.studentId, ctx.universityId, ctx.bookingId, "NO_SHOW_PENALTY", 30);
  await writeDisciplineLog(tx, {
    universityId: ctx.universityId,
    studentId: ctx.studentId,
    bookingId: ctx.bookingId,
    eventType: "NO_SHOW_PENALTY",
    deltaPoints: -30,
    lockUntil,
    note: `ไม่มาตามนัดครั้งที่ ${newCount} — ล็อก ${lockDays} วัน`,
    createdById: ctx.actorAccountId,
  });
}

/**
 * Reverse a no-show penalty when a consultant edits attendance to correct an accidental NO_SHOW.
 * Restores 30 pts, decrements count, and removes lock if count becomes 0.
 */
export async function reverseNoShowPenalty(tx: Tx, ctx: PenaltyCtx) {
  const trust = await getOrCreateTrust(tx, ctx.universityId, ctx.studentId);
  if (trust.student_trust_no_show_count <= 0) return; // Nothing to reverse

  const newCount = trust.student_trust_no_show_count - 1;
  const lockUntil = newCount === 0 ? null : trust.student_trust_locked_until;

  await tx.studentBehaviorStatus.update({
    where: { university_id_student_id: { university_id: ctx.universityId, student_id: ctx.studentId } },
    data: {
      student_trust_no_show_count: newCount,
      student_trust_locked_until: lockUntil,
    },
  });

  await restorePoints(tx, ctx.studentId, ctx.universityId, 30);
  await writeDisciplineLog(tx, {
    universityId: ctx.universityId,
    studentId: ctx.studentId,
    bookingId: ctx.bookingId,
    eventType: "EXCEPTION_APPROVED_ROLLBACK",
    deltaPoints: 30,
    lockUntil,
    note: `แก้ไขบันทึก (ยกเลิก No Show) — คืน 30 แต้ม`,
    createdById: ctx.actorAccountId,
  });
}

/**
 * Roll back penalty when HeadConsultant approves an exception request.
 *
 * Business Rules:
 *  - NO_SHOW (<6h cancel): full reset — count→0, restore 30 pts, unlock
 *  - LATE_CANCEL (6-24h):  per-booking — count -1, restore 7 pts (20÷3),
 *                          unlock only if new count < 3
 */
export async function rollbackPenalty(tx: Tx, ctx: RollbackCtx) {
  const request = await tx.bookingExceptionRequest.findUnique({
    where: { booking_exception_request_id: ctx.exceptionRequestId },
    include: { booking: { include: { attendance: true } } },
  });
  if (!request) throw new Error("Exception request not found");

  const trust = await getOrCreateTrust(tx, ctx.universityId, ctx.studentId);

  const isNoShow =
    request.booking?.attendance?.booking_attendance_status === "NO_SHOW";

  let refundAmount = 0;

  if (isNoShow) {
    // ── NO_SHOW (<6h): full reset ──
    await tx.studentBehaviorStatus.update({
      where: { university_id_student_id: { university_id: ctx.universityId, student_id: ctx.studentId } },
      data: {
        student_trust_no_show_count: 0,
        student_trust_locked_until: null, // release lock
      },
    });
    refundAmount = 30;

    await restorePoints(tx, ctx.studentId, ctx.universityId, refundAmount);
    await writeDisciplineLog(tx, {
      universityId: ctx.universityId,
      studentId: ctx.studentId,
      bookingId: request.booking_id,
      eventType: "EXCEPTION_APPROVED_ROLLBACK",
      deltaPoints: refundAmount,
      lockUntil: null,
      note: `อนุมัติยกเว้นโทษ (No-Show) — คืน ${refundAmount} แต้ม, ปลด lock`,
      createdById: ctx.actorAccountId,
    });
  } else {
    // ── LATE_CANCEL (6-24h): decrement by 1, refund 7 pts ──
    const REFUND_PER_BOOKING = 7; // 20 ÷ 3 ≈ 7 pts per booking
    const newCount = Math.max(0, trust.student_trust_late_cancel_count - 1);
    const shouldUnlock = newCount < 3;

    await tx.studentBehaviorStatus.update({
      where: { university_id_student_id: { university_id: ctx.universityId, student_id: ctx.studentId } },
      data: {
        student_trust_late_cancel_count: newCount,
        student_trust_locked_until: shouldUnlock ? null : undefined, // only clear lock if count < 3
      },
    });
    refundAmount = REFUND_PER_BOOKING;

    await restorePoints(tx, ctx.studentId, ctx.universityId, refundAmount);
    await writeDisciplineLog(tx, {
      universityId: ctx.universityId,
      studentId: ctx.studentId,
      bookingId: request.booking_id,
      eventType: "EXCEPTION_APPROVED_ROLLBACK",
      deltaPoints: refundAmount,
      lockUntil: shouldUnlock ? null : trust.student_trust_locked_until,
      note: `อนุมัติยกเว้นโทษ (Late Cancel) — ลด count เป็น ${newCount}, คืน ${refundAmount} แต้ม${shouldUnlock ? ", ปลด lock" : ""}`,
      createdById: ctx.actorAccountId,
    });
  }
}
