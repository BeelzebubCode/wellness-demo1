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

function buildScopeWhere(advisorId: number, filters: AdvisorFilters) {
    const clauses: string[] = [`advisor_id = ${advisorId}`];
    if (filters.gender?.length) {
        clauses.push(`gender_code IN (${filters.gender.map(g => `'${g}'`).join(",")})`);
    }
    if (filters.familyIncomeBracket?.length) {
        clauses.push(`income_bracket_code IN (${filters.familyIncomeBracket.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.bloodGroup?.length) {
        clauses.push(`blood_group_code IN (${filters.bloodGroup.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.parentalStatus?.length) {
        clauses.push(`parental_status_code IN (${filters.parentalStatus.map(v => `'${v}'`).join(",")})`);
    }
    const w = `WHERE ${clauses.join(" AND ")}`;
    const bw = `WHERE advisor_id = ${advisorId}`;
    return { studentWhere: w, bookingWhere: bw, riskWhere: bw };
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
