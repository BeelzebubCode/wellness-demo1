// src/services/dashboards/handlers/getAdvisorStoryDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Advisee-scoped analytics — powered by Materialized Views
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { queryAllStories, type StoryType } from "./queryDashboardMVs";

export type { StoryType };

export interface AdvisorFilters {
    dateStart?: Date;
    dateEnd?: Date;
    allTime?: boolean;
    gender?: string[];
    problemCategoryIds?: number[];
    serviceMode?: string[];
    bookingStatus?: string[];
    attendanceStatus?: string[];
    familyIncomeBracket?: string[];
    bloodGroup?: string[];
    parentalStatus?: string[];
}

function toYYYYMM(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function toDateStr(d: Date): string {
    return d.toISOString().split("T")[0];
}

function buildScopeWhere(advisorId: number, filters: AdvisorFilters) {
    // ── mv_student_summary: structural + profile columns ──────────────────────
    const studentClauses: string[] = [`advisor_id = ${advisorId}`];
    if (filters.gender?.length)        studentClauses.push(`gender_code IN (${filters.gender.map(g => `'${g}'`).join(",")})`);
    if (filters.familyIncomeBracket?.length) studentClauses.push(`income_bracket_code IN (${filters.familyIncomeBracket.map(v => `'${v}'`).join(",")})`);
    if (filters.bloodGroup?.length)    studentClauses.push(`blood_group_code IN (${filters.bloodGroup.map(v => `'${v}'`).join(",")})`);
    if (filters.parentalStatus?.length) studentClauses.push(`parental_status_code IN (${filters.parentalStatus.map(v => `'${v}'`).join(",")})`);
    const w = `WHERE ${studentClauses.join(" AND ")}`;

    // ── mv_booking_summary: structural + month + problem_category_id + booking_status + service_mode_code ─
    const bookClauses: string[] = [`advisor_id = ${advisorId}`];
    if (filters.problemCategoryIds?.length) bookClauses.push(`problem_category_id IN (${filters.problemCategoryIds.join(",")})`);
    if (filters.bookingStatus?.length)    bookClauses.push(`booking_status IN (${filters.bookingStatus.map(v => `'${v}'`).join(",")})`);
    if (filters.serviceMode?.length)      bookClauses.push(`service_mode_code IN (${filters.serviceMode.map(v => `'${v}'`).join(",")})`);
    if (!filters.allTime) {
        if (filters.dateStart) bookClauses.push(`month >= '${toYYYYMM(filters.dateStart)}'`);
        if (filters.dateEnd)   bookClauses.push(`month <= '${toYYYYMM(filters.dateEnd)}'`);
    }
    const bw = `WHERE ${bookClauses.join(" AND ")}`;

    // ── mv_student_risk_score: structural + latest_recorded_at ONLY ───────────
    const riskClauses: string[] = [`advisor_id = ${advisorId}`];
    if (!filters.allTime) {
        if (filters.dateStart) riskClauses.push(`latest_recorded_at >= '${toDateStr(filters.dateStart)}'`);
        if (filters.dateEnd)   riskClauses.push(`latest_recorded_at <= '${toDateStr(filters.dateEnd)} 23:59:59'`);
    }
    const rw = `WHERE ${riskClauses.join(" AND ")}`;

    return { studentWhere: w, bookingWhere: bw, riskWhere: rw };
}

export const AdvisorStoryService = {
    async getAdviseeStoryStats(
        advisorId: number,
        universityId: number,
        filters: AdvisorFilters = {},
        story: StoryType = "all",
    ) {
        const startTime = Date.now();

        const advisorInfo = await prisma.advisor.findUnique({
            where: { advisor_id: advisorId },
            include: { account: { select: { account_username: true } } },
        });

        const scope = buildScopeWhere(advisorId, filters);
        const stories = await queryAllStories(scope, story);

        const elapsed = Date.now() - startTime;
        console.log(`[ADVISOR_MV] story=${story} took ${elapsed}ms`);

        return {
            advisor: {
                advisorId,
                username: advisorInfo?.account?.account_username ?? "",
            },
            ...stories,
        };
    },
};
