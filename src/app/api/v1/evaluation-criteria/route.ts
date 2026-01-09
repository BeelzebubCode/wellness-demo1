import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const criteria = await prisma.evaluationCriterion.findMany({
      orderBy: { evaluation_criterion_display_order: "asc" },
      select: {
        evaluation_criterion_id: true,
        evaluation_criterion_topic_th: true,
        evaluation_criterion_weight: true,
      },
    });

    return NextResponse.json({ success: true, criteria });
  } catch (e) {
    console.error("GET evaluation-criteria error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to load criteria" },
      { status: 500 }
    );
  }
}
