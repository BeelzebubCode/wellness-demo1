// src/app/api/admin/data-center/consultants/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TZ = "Asia/Bangkok";

function formatDate(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const consultantId = Number(params.id);

  if (isNaN(consultantId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const consultant = await prisma.consultant.findUnique({
      where: { consultant_id: consultantId },
      include: {
        profile: true,
        organization: true,
        specializations: true,
        languages: true,
        bookings: {
          orderBy: { booking_created_at: "desc" },
          take: 20,
          include: {
            student: { include: { profile: true } },
            problemCategory: true,
            bookingSlots: { include: { timeSlot: true } },
          },
        },
        feedbacks: {
          include: {
            ratings: {
              include: { criterion: true },
            },
          },
        },
      },
    });

    if (!consultant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ACTIVE_STATUSES = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"];

    // Calculate ratings by criterion
    const ratingsByCriterion = new Map<string, { total: number; count: number }>();
    
    for (const feedback of consultant.feedbacks) {
      for (const rating of feedback.ratings) {
        const key = rating.criterion.evaluation_criterion_topic_th;
        const current = ratingsByCriterion.get(key) ?? { total: 0, count: 0 };
        ratingsByCriterion.set(key, {
          total: current.total + rating.feedback_rating_score,
          count: current.count + 1,
        });
      }
    }

    const ratings = Array.from(ratingsByCriterion.entries()).map(([criterion, { total, count }]) => ({
      criterion,
      avgScore: Math.round((total / count) * 10) / 10,
      count,
    }));

    // All ratings average
    const allRatings = consultant.feedbacks.flatMap(f => f.ratings);
    const avgRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.feedback_rating_score, 0) / allRatings.length
      : null;

    return NextResponse.json({
      id: consultant.consultant_id,
      name: `${consultant.profile?.consultant_first_name ?? ""} ${consultant.profile?.consultant_last_name ?? ""}`.trim(),
      email: consultant.profile?.consultant_email,
      phone: consultant.profile?.consultant_phone_number,
      organization: consultant.organization.organization_name,
      specializations: consultant.specializations.map(s => s.consultant_specialization_topic),
      languages: consultant.languages.map(l => l.consultant_language_code),
      activeQueueCount: consultant.bookings.filter(b => ACTIVE_STATUSES.includes(b.booking_status)).length,
      totalBookings: consultant.bookings.length,
      completedBookings: consultant.bookings.filter(b => b.booking_status === "COMPLETED").length,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      createdAt: consultant.consultant_created_at.toISOString().split("T")[0],

      recentBookings: consultant.bookings.slice(0, 10).map((b) => {
        const slot = b.bookingSlots[0]?.timeSlot;
        return {
          id: b.booking_id,
          date: formatDate(slot?.time_slot_start_datetime ?? null) ?? "-",
          studentName: `${b.student.profile?.student_first_name ?? ""} ${b.student.profile?.student_last_name ?? ""}`.trim(),
          problemType: b.problemCategory.problem_category_name_th,
          status: b.booking_status,
        };
      }),

      ratings,
    });
  } catch (error) {
    console.error("[GET /data-center/consultants/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultant" },
      { status: 500 }
    );
  }
}