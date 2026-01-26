// src/app/api/v2/bookings/[id]/feedback/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";

type Body = {
  isAnonymous?: boolean;
  commentText?: string;
  ratings: Array<{
    criterionId: number;
    score: number; // 1-5
  }>;
};

const RULE_CODE = "FEEDBACK_SUBMITTED"; // ✅ ไปสร้างใน point_rule (seed) ให้เรียบร้อย

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ====== Auth + Tenant ======
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 400 }
      );
    }

    // ====== Params ======
    const bookingId = Number(params.id);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid booking id" },
        { status: 400 }
      );
    }

    // ====== Body validate ======
    const body = (await req.json()) as Body;

    if (!Array.isArray(body.ratings) || body.ratings.length === 0) {
      return NextResponse.json(
        { success: false, error: "ratings required" },
        { status: 400 }
      );
    }

    for (const r of body.ratings) {
      if (
        !Number.isFinite(r.criterionId) ||
        !Number.isFinite(r.score) ||
        r.score < 1 ||
        r.score > 5
      ) {
        return NextResponse.json(
          { success: false, error: "คะแนนต้องอยู่ในช่วง 1-5" },
          { status: 400 }
        );
      }
    }

    // ====== Transaction: create feedback + award points ======
    const result = await prisma.$transaction(async (tx) => {
      // 1) โหลด booking แบบ tenant-safe + owner-safe
      const booking = await tx.booking.findFirst({
        where: {
          booking_id: bookingId,
          university_id: activeUniversityId,
          student_id: account.studentId,
        },
        select: {
          booking_id: true,
          booking_status: true,
          student_id: true,
          consultant_id: true,
          outcome: { select: { booking_id: true } },
          feedback: { select: { feedback_id: true } },
        },
      });

      if (!booking) {
        return {
          ok: false as const,
          status: 404,
          error: "Booking not found",
        };
      }

      // 2) กันประเมินซ้ำ
      if (booking.feedback) {
        return {
          ok: false as const,
          status: 409,
          error: "Booking นี้ถูกประเมินแล้ว",
        };
      }

      // 3) เงื่อนไขประเมินได้
      if (booking.booking_status !== "COMPLETED") {
        return {
          ok: false as const,
          status: 400,
          error: "ประเมินได้เมื่อสถานะเสร็จสิ้นเท่านั้น",
        };
      }

      if (!booking.consultant_id) {
        return {
          ok: false as const,
          status: 400,
          error: "ยังไม่มีผู้ให้คำปรึกษา",
        };
      }

      if (!booking.outcome) {
        return {
          ok: false as const,
          status: 400,
          error: "ต้องมีผลการให้คำปรึกษา (Outcome) ก่อนจึงจะประเมินได้",
        };
      }

      // 4) สร้าง feedback
      const created = await tx.feedback.create({
        data: {
          booking_id: booking.booking_id,
          student_id: booking.student_id,
          consultant_id: booking.consultant_id,
          feedback_is_anonymous: body.isAnonymous ?? true,
          ratings: {
            create: body.ratings.map((r) => ({
              evaluation_criterion_id: r.criterionId,
              feedback_rating_score: r.score,
            })),
          },
          comment: body.commentText
            ? { create: { feedback_comment_text: body.commentText } }
            : undefined,
        },
        select: { feedback_id: true },
      });

      // 5) ให้แต้มหลังประเมิน (ถ้ามี point_rule)
      const rule = await tx.pointRule.findUnique({
        where: { point_rule_code: RULE_CODE },
      });

      let pointsAwarded = 0;

      if (rule && rule.point_rule_is_active) {
        // กันซ้ำ: ถ้ามี txn ของ booking+rule แล้ว ห้ามบวกซ้ำ
        const alreadyGiven = await tx.studentPointTransaction.findFirst({
          where: {
            student_id: booking.student_id,
            booking_id: booking.booking_id,
            point_rule_id: rule.point_rule_id,
            student_point_txn_type: "EARN",
          },
          select: { student_point_transaction_id: true },
        });

        if (!alreadyGiven) {
          await tx.studentPointTransaction.create({
            data: {
              student_id: booking.student_id,
              point_rule_id: rule.point_rule_id,
              booking_id: booking.booking_id,
              student_point_txn_type: "EARN",
              student_point_amount: rule.point_rule_points,
              student_point_note: "Reward for submitting feedback",
            },
          });

          await tx.studentPointWallet.upsert({
            where: { student_id: booking.student_id },
            create: {
              student_id: booking.student_id,
              student_point_balance: rule.point_rule_points,
            },
            update: {
              student_point_balance: { increment: rule.point_rule_points },
              student_point_updated_at: new Date(),
            },
          });

          pointsAwarded = rule.point_rule_points;
        }
      }

      return {
        ok: true as const,
        feedbackId: created.feedback_id,
        pointsAwarded,
      };
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: result.feedbackId,
      pointsAwarded: result.pointsAwarded,
    });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;

    // requireTenant/assertRole จะ throw มาด้วย
    if (status === 401) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status });
    }
    if (status === 403) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status });
    }

    console.error("POST /api/v2/bookings/[id]/feedback error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
