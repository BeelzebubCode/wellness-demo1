
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    // 0. Extract token
    const tokenCookie = req.cookies.get("auth_token");
    if (!tokenCookie) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = await verifyToken(tokenCookie.value);
    if (!token || !token.accountId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Validate Dean Role
    const account = await prisma.account.findUnique({
      where: { account_id: token.accountId },
      include: {
        facultiesDean: true, // Get linked faculties
      },
    });

    if (!account || account.account_role !== "DEAN") {
      return NextResponse.json({ success: false, error: "Forbidden: Dean access required" }, { status: 403 });
    }

    if (account.facultiesDean.length === 0) {
      return NextResponse.json({ success: false, error: "No faculty assigned to this Dean account" }, { status: 404 });
    }

    // 2. Get Faculty Data (Assume single faculty for now, or take the first one)
    const faculty = account.facultiesDean[0];

    // 3. Get Student Metrics for this Faculty
    // Fetch all departments in this faculty
    const departments = await prisma.department.findMany({
      where: { faculty_id: faculty.faculty_id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    // Mock risk calculation for now (since real risk calculation is complex)
    // In production, this would query aggregated risk tables or student assessments
    const departmentStats = departments.map((dept) => {
      // @ts-ignore: _count property is valid in Prisma include but TS might complain if types aren't fully generated
      const studentCount = dept._count?.students || 0;
      // Mocking ~5% critical risk for demo
      const criticalRisk = Math.floor(studentCount * 0.05); 
      return {
        departmentCode: dept.department_code,
        departmentName: dept.department_name_en || dept.department_name_th,
        studentCount: studentCount,
        criticalRiskDetails: criticalRisk,
      };
    });

    const totalStudents = departmentStats.reduce((acc, curr) => acc + curr.studentCount, 0);
    const totalCritical = departmentStats.reduce((acc, curr) => acc + curr.criticalRiskDetails, 0);

    return NextResponse.json({
      success: true,
      data: {
        facultyName: faculty.faculty_name_en || faculty.faculty_name_th,
        totalStudents,
        riskDistribution: {
          critical: totalCritical,
          high: Math.floor(totalStudents * 0.1),
          moderate: Math.floor(totalStudents * 0.2),
          normal: totalStudents - totalCritical - Math.floor(totalStudents * 0.3),
        },
        departmentStats,
      },
    });

  } catch (error) {
    console.error("[DEAN_DASHBOARD_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
