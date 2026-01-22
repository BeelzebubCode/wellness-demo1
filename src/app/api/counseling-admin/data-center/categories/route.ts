// src/app/api/admin/data-center/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";

  try {
    const where: any = {};

    if (search) {
      where.OR = [
        { problem_category_code: { contains: search } },
        { problem_category_name_th: { contains: search } },
        { problem_category_name_en: { contains: search } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.problemCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { problem_category_id: "asc" },
        include: {
          bookings: {
            select: {
              booking_id: true,
              booking_status: true,
            },
          },
        },
      }),
      prisma.problemCategory.count({ where }),
    ]);

    const data = categories.map((c) => {
      const pendingCount = c.bookings.filter(b => 
        ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"].includes(b.booking_status)
      ).length;

      const completedCount = c.bookings.filter(b => 
        b.booking_status === "COMPLETED"
      ).length;

      return {
        id: c.problem_category_id,
        code: c.problem_category_code,
        nameTh: c.problem_category_name_th,
        nameEn: c.problem_category_name_en,
        description: c.problem_category_description,
        totalBookings: c.bookings.length,
        pendingCount,
        completedCount,
      };
    });

    return NextResponse.json({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /data-center/categories] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}