//src\app\api\v2\me\points\transactions\route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";

function toInt(v: string | null, def: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    const studentId = account.studentId;
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 400 }
      );
    }

    // tenant-safe
    const student = await prisma.student.findFirst({
      where: { student_id: studentId, university_id: activeUniversityId },
      select: { student_id: true },
    });
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Forbidden (tenant mismatch)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, toInt(searchParams.get("limit"), 20)));
    const cursor = searchParams.get("cursor"); // ใช้ id เป็น cursor

    const where: any = { student_id: studentId };
    if (cursor) where.student_point_transaction_id = { lt: Number(cursor) };

    const rows = await prisma.studentPointTransaction.findMany({
      where,
      orderBy: { student_point_transaction_id: "desc" },
      take: limit + 1,
      include: {
        rule: {
          select: {
            point_rule_code: true,
            point_rule_name_th: true,
          },
        },
      },
    });

    const hasNext = rows.length > limit;
    const items = (hasNext ? rows.slice(0, limit) : rows).map((r) => ({
      id: r.student_point_transaction_id,
      createdAt: r.student_point_created_at,
      type: r.student_point_txn_type,
      amount: r.student_point_amount,
      ruleCode: r.rule?.point_rule_code ?? null,
      ruleNameTh: r.rule?.point_rule_name_th ?? null,
      bookingId: r.booking_id ?? null,
      note: r.student_point_note ?? null,
    }));

    return NextResponse.json({
      success: true,
      items,
      nextCursor: hasNext ? String(items[items.length - 1].id) : null,
    });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "Failed" },
      { status }
    );
  }
}
