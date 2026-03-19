// src/app/api/v2/dashboards/head-department/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";
import { HeadDepartmentService, type HeadDeptFilters, type StoryType } from "@/services/dashboards/handlers/getHeadDepartmentDashboard";

export async function GET(req: NextRequest) {
    try {
        const token = await verifyToken(extractToken(req) || "");
        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            include: {
                roleCategory: { select: { code: true } },
                departmentsHead: {
                    select: {
                        department_id: true,
                        university_id: true,
                        faculty_id: true,
                    },
                },
            },
        });

        if (!account || account.roleCategory.code !== "HEAD_DEPARTMENT") {
            return NextResponse.json(
                { success: false, error: "Forbidden: Head Department access required" },
                { status: 403 }
            );
        }

        const dept = account.departmentsHead[0];
        if (!dept) {
            return NextResponse.json(
                { success: false, error: "No department assigned" },
                { status: 404 }
            );
        }

        const sp = req.nextUrl.searchParams;

        // Story parameter — which card is requesting data
        const story = (sp.get("story") ?? "all") as StoryType;

        const allTime = sp.get("all_time") === "true";
        let dateStart: Date | undefined;
        let dateEnd: Date | undefined;
        if (!allTime) {
            const ds = sp.get("date_start");
            const de = sp.get("date_end");
            if (ds) dateStart = new Date(ds);
            if (de) dateEnd = new Date(de);
        }

        const parseCSV = (key: string): string[] | undefined => {
            const v = sp.get(key);
            return v ? v.split(",").filter(Boolean) : undefined;
        };

        const parseCSVNumbers = (key: string): number[] | undefined => {
            const v = sp.get(key);
            if (!v) return undefined;
            return v.split(",").map(Number).filter(n => !isNaN(n));
        };

        const filters: HeadDeptFilters = {
            dateStart,
            dateEnd,
            allTime,
            gender: parseCSV("gender"),
            problemCategoryIds: parseCSVNumbers("problem_category_ids"),
            serviceMode: parseCSV("service_mode"),
            bookingStatus: parseCSV("booking_status"),
            attendanceStatus: parseCSV("attendance_status"),
            familyIncomeBracket: parseCSV("family_income_bracket"),
            bloodGroup: parseCSV("blood_group"),
            birthOrder: parseCSV("birth_order"),
            chronicConditionIds: parseCSVNumbers("chronic_condition_ids"),
            parentalStatus: parseCSV("parental_status"),
            advisorId: parseCSVNumbers("advisorId"),
        };

        const data = await HeadDepartmentService.getDepartmentStoryStats(
            dept.department_id,
            dept.university_id,
            dept.faculty_id,
            filters,
            story,
        );

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[HEAD_DEPARTMENT_DASHBOARD_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
