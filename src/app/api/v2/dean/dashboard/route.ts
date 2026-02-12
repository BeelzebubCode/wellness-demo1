
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import { DeanService } from "@/services/dean/dean-service";

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

    // 2. Get Faculty Data
    const searchParams = req.nextUrl.searchParams;
    const facultyCode = searchParams.get("facultyCode");

    let faculty;
    if (facultyCode) {
      faculty = account.facultiesDean.find((f) => f.faculty_code === facultyCode);
      if (!faculty) {
        return NextResponse.json({ success: false, error: "Faculty not found or not assigned to you" }, { status: 404 });
      }
    } else {
      // Default to first faculty if no code provided
      faculty = account.facultiesDean[0];
    }

    // 3. Get Student Metrics
    // We need the university ID
    const universityId = account.account_home_university_id || faculty.university_id;

    if (!universityId) {
      return NextResponse.json({ success: false, error: "University context missing" }, { status: 500 });
    }

    // Parse Date Range
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let dateRange: { start?: Date; end?: Date } | undefined;

    if (startDateParam || endDateParam) {
      dateRange = {};
      if (startDateParam) {
        const start = new Date(startDateParam);
        if (!isNaN(start.getTime())) dateRange.start = start;
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        if (!isNaN(end.getTime())) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setHours(23, 59, 59, 999);
          dateRange.end = adjustedEnd;
        }
      }
      
      // If none were valid, reset to undefined
      if (Object.keys(dateRange).length === 0) {
        dateRange = undefined;
      }
    }

    console.log('[Dean Dashboard API] Date range received:', { startDateParam, endDateParam, dateRange });

    try {
      const stats = await DeanService.getFacultyStats(faculty.faculty_id, universityId, dateRange);

      return NextResponse.json({
        success: true,
        data: stats,
      });
    } catch (serviceError: any) {
      console.error("DeanService Error:", serviceError);
      return NextResponse.json(
        { success: false, error: serviceError.message || "Failed to fetch faculty statistics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[DEAN_DASHBOARD_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
