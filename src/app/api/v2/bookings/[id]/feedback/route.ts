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

const RULE_CODE = "FEEDBACK_SUBMITTED"; // ✅ ต้องมีใน point_rule

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    const studentId = (account as any).studentId ?? (account as any).student_id;
    if (typeof studentId !== "number") {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 400 },
      );
    }

    const bookingId = Number(params.id);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid booking id" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    if (!Array.isArray(body.ratings) || body.ratings.length === 0) {
      return NextResponse.json(
        { success: false, error: "ratings required" },
        { status: 400 },
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
          { status: 400 },
        );
      }
    }

    const commentText = String(body.commentText ?? "").trim();
    const isAnonymous = body.isAnonymous ?? true;

    const result = await prisma.$transaction(async (tx) => {
      // ✅ โหลด booking แบบ tenant-safe + owner-safe (ใช้ composite id)
      const booking = await tx.booking.findUnique({
        where: {
          university_id_booking_id: {
            university_id: activeUniversityId,
            booking_id: bookingId,
          },
        },
        select: {
          booking_id: true,
          university_id: true,
          booking_status: true,
          student_id: true,
          consultant_id: true,

          // relation checks
          outcome: { select: { booking_id: true } },
          feedback: { select: { feedback_id: true } },
        },
      });

      if (!booking || booking.student_id !== studentId) {
        return { ok: false as const, status: 404, error: "Booking not found" };
      }

      // ✅ กันประเมินซ้ำ
      if (booking.feedback) {
        return {
          ok: false as const,
          status: 409,
          error: "Booking นี้ถูกประเมินแล้ว",
        };
      }

      // ✅ เงื่อนไขประเมินได้
      if (booking.booking_status !== "COMPLETED") {
        return {
          ok: false as const,
          status: 400,
          error: "ประเมินได้เมื่อสถานะเสร็จสิ้นเท่านั้น",
        };
      }

      if (!booking.consultant_id) {
        return { ok: false as const, status: 400, error: "ยังไม่มีผู้ให้คำปรึกษา" };
      }

      if (!booking.outcome) {
        return {
          ok: false as const,
          status: 400,
          error: "ต้องมีผลการให้คำปรึกษา (Outcome) ก่อนจึงจะประเมินได้",
        };
      }

      // ✅ สร้าง feedback (ต้องใส่ university_id ตาม schema)
      const created = await tx.feedback.create({
        data: {
          university_id: activeUniversityId,
          booking_id: booking.booking_id,
          student_id: booking.student_id,
          consultant_id: booking.consultant_id,
          feedback_is_anonymous: isAnonymous,

          ratings: {
            create: body.ratings.map((r) => ({
              evaluation_criterion_id: r.criterionId,
              feedback_rating_score: r.score,
            })),
          },

          comment: commentText
            ? { create: { feedback_comment_text: commentText } }
            : undefined,
        },
        select: { feedback_id: true },
      });

      // ✅ หา rule
      const rule =
        (await tx.pointRule.findFirst({
          where: {
            point_rule_is_active: true,
            point_rule_code: RULE_CODE,
          },
        })) ?? null;

      let pointsAwarded = 0;

      if (rule) {
        // ✅ กันให้ซ้ำ: ต้องเช็ค booking_university_id + booking_id + rule
        const alreadyGiven = await tx.studentPointTransaction.findFirst({
          where: {
            student_id: booking.student_id,
            point_rule_id: rule.point_rule_id,
            student_point_txn_type: "EARN",

            booking_university_id: activeUniversityId,
            booking_id: booking.booking_id,
          },
          select: { student_point_transaction_id: true },
        });

        if (!alreadyGiven) {
          await tx.studentPointTransaction.create({
            data: {
              student_id: booking.student_id,
              point_rule_id: rule.point_rule_id,

              booking_university_id: activeUniversityId,
              booking_id: booking.booking_id,

              student_point_txn_type: "EARN",
              student_point_amount: rule.point_rule_points,
              student_point_note: "Reward for submitting feedback",
            },
          });

          // ✅ Wallet ของคุณเป็น @@id([university_id, student_id])
          await tx.studentPointWallet.upsert({
            where: {
              university_id_student_id: {
                university_id: activeUniversityId,
                student_id: booking.student_id,
              },
            },
            create: {
              university_id: activeUniversityId,
              student_id: booking.student_id,
              student_point_balance: rule.point_rule_points,
            },
            update: {
              student_point_balance: { increment: rule.point_rule_points },
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
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: result.feedbackId,
      pointsAwarded: result.pointsAwarded,
    });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;

    if (status === 401) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status });
    }
    if (status === 403) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status });
    }

    console.error("POST /api/v2/bookings/[id]/feedback error:", e);
    return NextResponse.json(
      { success: false, error: e?.message ?? "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
