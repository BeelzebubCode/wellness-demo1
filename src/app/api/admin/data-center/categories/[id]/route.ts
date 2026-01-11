// src/app/api/admin/data-center/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const categoryId = Number(params.id);

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const category = await prisma.problemCategory.findUnique({
      where: { problem_category_id: categoryId },
      include: {
        bookings: {
          select: {
            booking_id: true,
            booking_status: true,
            booking_created_at: true,
            consultant_id: true,
            consultant: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const bookings = category.bookings;
    const pendingCount = bookings.filter((b) =>
      ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"].includes(b.booking_status)
    ).length;
    const completedCount = bookings.filter((b) => b.booking_status === "COMPLETED").length;

    // Monthly stats (last 6 months)
    const now = new Date();
    const monthlyStats: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const count = bookings.filter((b) => {
        const created = new Date(b.booking_created_at);
        return created >= monthStart && created <= monthEnd;
      }).length;

      monthlyStats.push({
        month: date.toLocaleDateString("th-TH", { month: "short" }),
        count,
      });
    }

    // Top consultants
    const consultantCounts = new Map<number, { name: string; count: number }>();

    for (const b of bookings) {
      if (b.consultant_id && b.consultant) {
        const name = `${b.consultant.profile?.consultant_first_name ?? ""} ${b.consultant.profile?.consultant_last_name ?? ""}`.trim();
        const current = consultantCounts.get(b.consultant_id) ?? { name, count: 0 };
        consultantCounts.set(b.consultant_id, { name, count: current.count + 1 });
      }
    }

    const topConsultants = Array.from(consultantCounts.entries())
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      id: category.problem_category_id,
      code: category.problem_category_code,
      nameTh: category.problem_category_name_th,
      nameEn: category.problem_category_name_en,
      description: category.problem_category_description,
      totalBookings: bookings.length,
      pendingCount,
      completedCount,
      monthlyStats,
      topConsultants,
    });
  } catch (error) {
    console.error("[GET /data-center/categories/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}