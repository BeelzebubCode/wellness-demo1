import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  isAnonymous?: boolean;
  commentText?: string;
  ratings: Array<{
    criterionId: number;
    score: number; // 1-5
  }>;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = Number(params.id);
    if (Number.isNaN(bookingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking id" },
        { status: 400 }
      );
    }

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

    // ✅ กันประเมินซ้ำ
    const existing = await prisma.feedback.findUnique({
      where: { booking_id: bookingId },
      select: { feedback_id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Booking นี้ถูกประเมินแล้ว" },
        { status: 409 }
      );
    }

    // ✅ ต้องเป็น COMPLETED ก่อน (ถ้าฟิลด์ชื่อ booking_status)
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      select: { booking_status: true, student_id: true, consultant_id: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.booking_status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "ประเมินได้เมื่อสถานะเสร็จสิ้นเท่านั้น" },
        { status: 400 }
      );
    }

    if (!booking.consultant_id) {
      return NextResponse.json(
        { success: false, error: "ยังไม่มีผู้ให้คำปรึกษา" },
        { status: 400 }
      );
    }

    const created = await prisma.feedback.create({
      data: {
        booking_id: bookingId,
        student_id: booking.student_id,
        consultant_id: booking.consultant_id,
        feedback_is_anonymous: body.isAnonymous ?? true,
        // ratings
        ratings: {
          create: body.ratings.map((r) => ({
            evaluation_criterion_id: r.criterionId,
            feedback_rating_score: r.score,
          })),
        },
        // comment
        comment: body.commentText
          ? {
              create: { feedback_comment_text: body.commentText },
            }
          : undefined,
      },
      select: { feedback_id: true },
    });

    return NextResponse.json({ success: true, feedbackId: created.feedback_id });
  } catch (e) {
    console.error("POST feedback error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
