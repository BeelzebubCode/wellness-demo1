// src/services/dashboards/handlers/getMinistryStoryDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// National-scoped analytics — powered by Materialized Views
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { queryAllStories, type StoryType } from "./queryDashboardMVs";

export type { StoryType };

export interface MinistryFilters {
    dateStart?: Date;
    dateEnd?: Date;
    allTime?: boolean;
    universityIds?: number[];
    gender?: string[];
    problemCategoryIds?: number[];
    serviceMode?: string[];
    bookingStatus?: string[];
    attendanceStatus?: string[];
    familyIncomeBracket?: string[];
    bloodGroup?: string[];
    parentalStatus?: string[];
}

function buildScopeWhere(filters: MinistryFilters) {
    // Student MV has profile columns (gender_code, income_bracket_code, etc.)
    const studentClauses: string[] = [];
    // Booking/Risk MVs only have structural columns (university_id, faculty_id, etc.)
    const structClauses: string[] = [];

    if (filters.universityIds?.length) {
        const uniFilter = `university_id IN (${filters.universityIds.join(",")})`;
        studentClauses.push(uniFilter);
        structClauses.push(uniFilter);
    }
    // Profile-based filters — only apply to mv_student_summary
    if (filters.gender?.length) {
        studentClauses.push(`gender_code IN (${filters.gender.map(g => `'${g}'`).join(",")})`);
    }
    if (filters.familyIncomeBracket?.length) {
        studentClauses.push(`income_bracket_code IN (${filters.familyIncomeBracket.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.bloodGroup?.length) {
        studentClauses.push(`blood_group_code IN (${filters.bloodGroup.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.parentalStatus?.length) {
        studentClauses.push(`parental_status_code IN (${filters.parentalStatus.map(v => `'${v}'`).join(",")})`);
    }

    const sw = studentClauses.length > 0 ? `WHERE ${studentClauses.join(" AND ")}` : "";
    const bw = structClauses.length > 0 ? `WHERE ${structClauses.join(" AND ")}` : "";
    return { studentWhere: sw, bookingWhere: bw, riskWhere: bw };
}

export const MinistryStoryService = {
    async getNationalStoryStats(
        filters: MinistryFilters = {},
        story: StoryType = "all",
    ) {
        const startTime = Date.now();

        const uniCount = await prisma.university.count({
            where: { university_is_active: true },
        });

        const scope = buildScopeWhere(filters);
        const stories = await queryAllStories(scope, story);

        const elapsed = Date.now() - startTime;
        console.log(`[MINISTRY_MV] story=${story} took ${elapsed}ms`);

        return {
            scope: { label: "ภาพรวมระดับชาติ", totalUniversities: uniCount },
            ...stories,
        };
    },
};
