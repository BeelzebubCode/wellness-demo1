// src/app/api/v2/me/points/rules/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

export async function GET(req: NextRequest) {
  try {
    await requireTenant(req);

    const rules = await prisma.pointRule.findMany({
      where: { point_rule_is_active: true },
      orderBy: { point_rule_created_at: "desc" },
      select: {
        point_rule_code: true,
        point_rule_name_th: true,
        point_rule_points: true,
      },
    });

    return NextResponse.json({ success: true, rules });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Failed to load point rules" },
      { status: 500 }
    );
  }
}
