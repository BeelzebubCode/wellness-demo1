// src/app/api/v2/me/points/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    const studentId = account.studentId;
    if (typeof studentId !== "number") {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 400 },
      );
    }

    // ✅ tenant-safe: student ต้องอยู่มหาลัยนี้จริง
    const student = await prisma.student.findFirst({
      where: { student_id: studentId, university_id: activeUniversityId },
      select: { student_id: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN (tenant mismatch)" },
        { status: 403 },
      );
    }

    // ✅ FIX: wallet เป็น composite key (university_id, student_id)
    const wallet = await prisma.studentPointWallet.findUnique({
      where: {
        university_id_student_id: {
          university_id: activeUniversityId,
          student_id: studentId,
        },
      },
      select: { student_point_balance: true },
    });

    return NextResponse.json({
      success: true,
      universityId: activeUniversityId,
      studentId,
      balance: wallet?.student_point_balance ?? 0,
    });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;

    const error =
      status === 401
        ? "UNAUTHORIZED"
        : status === 403
        ? "FORBIDDEN"
        : e?.message ?? "Failed";

    return NextResponse.json({ success: false, error }, { status });
  }
}
