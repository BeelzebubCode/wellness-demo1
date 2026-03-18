import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { RectorService } from "@/services/dashboards/handlers/getRectorDashboard";
import prisma from "@/lib/prisma";

/**
 * GET /api/v2/rector/faculties
 * Get all faculties in the rector's university
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
                roleCategory: { select: { code: true } },
                account_home_university_id: true,
            },
        });

        if (!account || account.roleCategory.code !== "RECTOR") {
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

        // 3. Get all faculties in the university
        const faculties = await RectorService.getAllFaculties(
            account.account_home_university_id
        );

        // 4. Apply search filter if provided
        const { searchParams } = new URL(req.url);
        const searchTerm = searchParams.get("search")?.toLowerCase() || "";

        let filteredFaculties = faculties;
        if (searchTerm) {
            filteredFaculties = faculties.filter(
                (faculty) =>
                    faculty.facultyName.toLowerCase().includes(searchTerm) ||
                    faculty.facultyCode.toLowerCase().includes(searchTerm) ||
                    faculty.facultyNameEn?.toLowerCase().includes(searchTerm)
            );
        }

        // 5. Transform to frontend format
        const data = filteredFaculties.map((faculty) => ({
            id: `${faculty.universityId}-${faculty.facultyId}`,
            code: faculty.facultyCode,
            name: faculty.facultyName,
            nameEn: faculty.facultyNameEn,
            universityId: faculty.universityId,
            universityCode: faculty.universityCode,
            universityName: faculty.universityName,
            studentCount: faculty.studentCount,
            departmentCount: faculty.departmentCount,
            subjectGroupCategory: faculty.subjectGroupCategory,
            subjectGroupCategoryTH: faculty.subjectGroupCategoryTH,
            logo: `/images/logo/${faculty.universityCode}_logo.png`,
        }));

        return NextResponse.json({
            success: true,
            data,
            count: data.length,
        });
    } catch (error: any) {
        console.error("[RECTOR_FACULTIES_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
