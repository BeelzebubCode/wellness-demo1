// src/app/api/v2/dashboards/rector/story/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";
import { RectorStoryService, type RectorFilters, type StoryType } from "@/services/dashboards/handlers/getRectorStoryDashboard";

export async function GET(req: NextRequest) {
    try {
        const token = await verifyToken(extractToken(req) || "");
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            select: { account_role: true, account_home_university_id: true },
        });

        if (!account || account.account_role !== "RECTOR") {
            return NextResponse.json({ success: false, error: "Forbidden: Rector access required" }, { status: 403 });
        }
        if (!account.account_home_university_id) {
            return NextResponse.json({ success: false, error: "No university assigned" }, { status: 404 });
        }

        const sp = req.nextUrl.searchParams;
        const story = (sp.get("story") ?? "all") as StoryType;
        const allTime = sp.get("all_time") === "true";
        let dateStart: Date | undefined, dateEnd: Date | undefined;
        if (!allTime) {
            const ds = sp.get("date_start"), de = sp.get("date_end");
            if (ds) dateStart = new Date(ds);
            if (de) dateEnd = new Date(de);
        }
        const parseCSV = (key: string): string[] | undefined => {
            const v = sp.get(key); return v ? v.split(",").filter(Boolean) : undefined;
        };
        const parseCSVNumbers = (key: string): number[] | undefined => {
            const v = sp.get(key); if (!v) return undefined;
            return v.split(",").map(Number).filter(n => !isNaN(n));
        };

        const filters: RectorFilters = {
            dateStart, dateEnd, allTime,
            facultyIds: parseCSVNumbers("faculty_ids"),
            departmentIds: parseCSVNumbers("department_ids"),
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
        };

        const data = await RectorStoryService.getUniversityStoryStats(
            account.account_home_university_id, filters, story,
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[RECTOR_STORY_DASHBOARD_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
