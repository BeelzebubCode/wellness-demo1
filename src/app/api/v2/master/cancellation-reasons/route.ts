// src/app/api/v2/master/cancellation-reasons/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/v2/master/cancellation-reasons
 * Fetches all cancellation reasons (public master data)
 */
export async function GET() {
  try {
    const reasons = await prisma.cancellationReason.findMany({
      select: {
        cancellation_reason_id: true,
        cancellation_reason_code: true,
        cancellation_reason_name_th: true,
        cancellation_reason_name_en: true,
        cancellation_reason_description: true,
      },
      orderBy: {
        cancellation_reason_id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reasons,
    });
  } catch (error) {
    console.error("[CANCELLATION_REASONS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cancellation reasons" },
      { status: 500 }
    );
  }
}
