// src/app/api/admin/data-center/consultants/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";
  const organizationId = searchParams.get("organizationId");

  try {
    const where: any = {};

    if (search) {
      where.OR = [
        { profile: { consultant_first_name: { contains: search } } },
        { profile: { consultant_last_name: { contains: search } } },
        { profile: { consultant_email: { contains: search } } },
      ];
    }

    if (organizationId) {
      where.organization_id = Number(organizationId);
    }

    const [consultants, total] = await Promise.all([
      prisma.consultant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { consultant_id: "desc" },
        include: {
          profile: true,
          organization: true,
          specializations: true,
          languages: true,
          bookings: {
            select: {
              booking_id: true,
              booking_status: true,
            },
          },
          feedbacks: {
            include: {
              ratings: true,
            },
          },
        },
      }),
      prisma.consultant.count({ where }),
    ]);

    const ACTIVE_STATUSES = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"];

    const data = consultants.map((c) => {
      const activeQueue = c.bookings.filter(b => 
        ACTIVE_STATUSES.includes(b.booking_status)
      ).length;

      const completedBookings = c.bookings.filter(b => 
        b.booking_status === "COMPLETED"
      ).length;

      // Calculate average rating
      const allRatings = c.feedbacks.flatMap(f => f.ratings);
      const avgRating = allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.feedback_rating_score, 0) / allRatings.length
        : null;

      return {
        id: c.consultant_id,
        name: `${c.profile?.consultant_first_name ?? ""} ${c.profile?.consultant_last_name ?? ""}`.trim() || "ไม่ระบุ",
        email: c.profile?.consultant_email ?? null,
        phone: c.profile?.consultant_phone_number ?? null,
        organization: c.organization.organization_name,
        specializations: c.specializations.map(s => s.consultant_specialization_topic),
        languages: c.languages.map(l => l.consultant_language_code),
        activeQueueCount: activeQueue,
        totalBookings: c.bookings.length,
        completedBookings,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        createdAt: c.consultant_created_at.toISOString().split("T")[0],
      };
    });

    return NextResponse.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /data-center/consultants] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultants" },
      { status: 500 }
    );
  }
}