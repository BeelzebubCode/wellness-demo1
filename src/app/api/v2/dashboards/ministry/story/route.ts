// src/app/api/v2/dashboards/ministry/story/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";
import { MinistryStoryService, type MinistryFilters, type StoryType } from "@/services/dashboards/handlers/getMinistryStoryDashboard";

export async function GET(req: NextRequest) {
    try {
        const token = await verifyToken(extractToken(req) || "");
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            select: { account_role: true },
        });

        if (!account || !["MINISTRY", "SUPER_ADMIN"].includes(account.account_role)) {
            return NextResponse.json({ success: false, error: "Forbidden: Ministry access required" }, { status: 403 });
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

        const filters: MinistryFilters = {
            dateStart, dateEnd, allTime,
            universityIds: parseCSVNumbers("university_ids"),
            gender: parseCSV("gender"),
            problemCategoryIds: parseCSVNumbers("problem_category_ids"),
            serviceMode: parseCSV("service_mode"),
            bookingStatus: parseCSV("booking_status"),
            attendanceStatus: parseCSV("attendance_status"),
            familyIncomeBracket: parseCSV("family_income_bracket"),
            bloodGroup: parseCSV("blood_group"),
            parentalStatus: parseCSV("parental_status"),
        };

        const data = await MinistryStoryService.getNationalStoryStats(filters, story);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[MINISTRY_STORY_DASHBOARD_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
