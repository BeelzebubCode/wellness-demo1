//src\app\api\v2\me\points\route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";

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

    // tenant-safe: เช็คว่า student อยู่มหาลัยนี้จริง
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

    const wallet = await prisma.studentPointWallet.findUnique({
      where: { student_id: studentId },
      select: { student_point_balance: true },
    });

    return NextResponse.json({
      success: true,
      balance: wallet?.student_point_balance ?? 0,
    });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "Failed" },
      { status }
    );
  }
}
