// src/app/api/v2/dashboards/dean/story/route.ts
// Story-based Dean dashboard API — same pattern as head-department
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";
import { DeanStoryService, type DeanFilters, type StoryType } from "@/services/dashboards/handlers/getDeanStoryDashboard";

export async function GET(req: NextRequest) {
    try {
        const token = await verifyToken(extractToken(req) || "");
        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            include: {
                facultiesDean: {
                    select: {
                        faculty_id: true,
                        university_id: true,
                    },
                },
            },
        });

        if (!account || account.account_role !== "DEAN") {
            return NextResponse.json(
                { success: false, error: "Forbidden: Dean access required" },
                { status: 403 }
            );
        }

        const faculty = account.facultiesDean[0];
        if (!faculty) {
            return NextResponse.json(
                { success: false, error: "No faculty assigned" },
                { status: 404 }
            );
        }

        const sp = req.nextUrl.searchParams;
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

        const filters: DeanFilters = {
            dateStart,
            dateEnd,
            allTime,
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

        const data = await DeanStoryService.getFacultyStoryStats(
            faculty.faculty_id,
            faculty.university_id,
            filters,
            story,
        );

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[DEAN_STORY_DASHBOARD_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
