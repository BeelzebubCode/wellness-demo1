import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { DeanService } from "@/services/dean/dean-service";
import prisma from "@/lib/prisma";

/**
 * GET /api/v2/rector/dashboard
 * Get faculty dashboard for Rector (can view any faculty in their university)
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

        // 3. Get faculty code from query params
        const { searchParams } = new URL(req.url);
        const facultyCode = searchParams.get("facultyCode");

        if (!facultyCode) {
            return NextResponse.json(
                { success: false, error: "Faculty code is required" },
                { status: 400 }
            );
        }

        // 4. Find faculty in rector's university
        const faculty = await prisma.faculty.findFirst({
            where: {
                faculty_code: facultyCode,
                university_id: account.account_home_university_id,
            },
        });

        if (!faculty) {
            return NextResponse.json(
                { success: false, error: "Faculty not found in your university" },
                { status: 404 }
            );
        }

        // 5. Get faculty statistics using DeanService
        const stats = await DeanService.getFacultyStats(
            faculty.faculty_id,
            faculty.university_id
        );

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error("[RECTOR_DASHBOARD_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
