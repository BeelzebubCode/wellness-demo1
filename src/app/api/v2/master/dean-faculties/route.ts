import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { DeanService } from "@/services/dashboards/handlers/getDeanDashboard";

/**
 * GET /api/v2/dean/faculties
 * Get all faculties managed by the authenticated dean
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

        // 2. Get faculties managed by this dean
        const faculties = await DeanService.getFacultiesByDean(token.accountId);

        // 3. Apply search filter if provided
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

        // 4. Transform to frontend format
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
            logo: `/images/logo/${faculty.universityCode}_logo.png`, // Using university logo for now
        }));

        return NextResponse.json({
            success: true,
            data,
            count: data.length,
        });
    } catch (error: any) {
        console.error("[DEAN_FACULTIES_ERROR]", error);

        // Handle specific errors
        if (error.message === "Account is not a dean or does not exist") {
            return NextResponse.json(
                { success: false, error: "Forbidden: Dean access required" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
