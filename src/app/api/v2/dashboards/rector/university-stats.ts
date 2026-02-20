import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { RectorService } from "@/services/dashboards/handlers/getRectorDashboard";
import prisma from "@/lib/prisma";

/**
 * GET /api/v2/rector/university-stats
 * Get university-wide aggregated statistics for Rector's main dashboard
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Authentication
        const tokenCookie = req.cookies.get("auth_token");
        if (!tokenCookie) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const token = await verifyToken(tokenCookie.value);
        if (!token || !token.accountId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Verify Rector role and get university
        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            select: {
                account_role: true,
                account_home_university_id: true,
            },
        });

        if (!account || account.account_role !== "RECTOR") {
            return NextResponse.json(
                { success: false, error: "Forbidden: Rector access required" },
                { status: 403 }
            );
        }

        if (!account.account_home_university_id) {
            return NextResponse.json(
                { success: false, error: "No university assigned to this Rector" },
                { status: 404 }
            );
        }

        // 3. Extract filters from query parameters
        const { searchParams } = new URL(req.url);
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");
        const facultyId = searchParams.get("facultyId");
        const departmentId = searchParams.get("departmentId");
        const problemCategoryId = searchParams.get("problemCategoryId");
        const gender = searchParams.get("gender");

        const filters = {
            startDate: startDateStr ? new Date(startDateStr) : undefined,
            endDate: endDateStr ? new Date(endDateStr) : undefined,
            facultyId: facultyId ? Number(facultyId) : undefined,
            departmentId: departmentId ? Number(departmentId) : undefined,
            problemCategoryId: problemCategoryId ? Number(problemCategoryId) : undefined,
            gender: gender || undefined,
        };

        // 4. Get university-wide statistics using RectorService
        const [stats, wellbeing, healthMap] = await Promise.all([
            RectorService.getUniversityStats(account.account_home_university_id, filters),
            RectorService.getUniversityWellbeing(account.account_home_university_id, filters),
            RectorService.getFacultyHealthMap(account.account_home_university_id, filters)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                ...stats,
                wellbeing,
                healthMap
            },
        });
    } catch (error: any) {
        console.error("[RECTOR_UNIVERSITY_STATS_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
