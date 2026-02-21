// src/app/api/v2/master/evaluation-criteria/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

export async function GET(req: NextRequest) {
  try {
    // ถ้า criteria ไม่ผูก tenant ก็ไม่ต้อง requireTenant ก็ได้
    await requireTenant(req);

    const criteria = await prisma.evaluationCriterion.findMany({
      orderBy: { evaluation_criterion_display_order: "asc" },
    });

    return NextResponse.json({ success: true, criteria });
  } catch (e) {
    console.error("GET /api/v2/master/evaluation-criteria error:", e);
    return NextResponse.json(
      { success: false, error: "โหลดเกณฑ์ประเมินไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
