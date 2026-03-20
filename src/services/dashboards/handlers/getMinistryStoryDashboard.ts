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

function toYYYYMM(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function toDateStr(d: Date): string {
    return d.toISOString().split("T")[0];
}

function buildScopeWhere(filters: MinistryFilters) {
    // ── mv_student_summary: structural + profile columns ──────────────────────
    const studentClauses: string[] = [];
    if (filters.universityIds?.length) studentClauses.push(`university_id IN (${filters.universityIds.join(",")})`);
    if (filters.gender?.length)        studentClauses.push(`gender_code IN (${filters.gender.map(g => `'${g}'`).join(",")})`);
    if (filters.familyIncomeBracket?.length) studentClauses.push(`income_bracket_code IN (${filters.familyIncomeBracket.map(v => `'${v}'`).join(",")})`);
    if (filters.bloodGroup?.length)    studentClauses.push(`blood_group_code IN (${filters.bloodGroup.map(v => `'${v}'`).join(",")})`);
    if (filters.parentalStatus?.length) studentClauses.push(`parental_status_code IN (${filters.parentalStatus.map(v => `'${v}'`).join(",")})`);
    const sw = studentClauses.length > 0 ? `WHERE ${studentClauses.join(" AND ")}` : "";

    // ── mv_booking_summary: structural + month + problem_category_id + booking_status + service_mode_code ─
    const bookClauses: string[] = [];
    if (filters.universityIds?.length)     bookClauses.push(`university_id IN (${filters.universityIds.join(",")})`);
    if (filters.problemCategoryIds?.length) bookClauses.push(`problem_category_id IN (${filters.problemCategoryIds.join(",")})`);
    if (filters.bookingStatus?.length)     bookClauses.push(`booking_status IN (${filters.bookingStatus.map(v => `'${v}'`).join(",")})`);
    if (filters.serviceMode?.length)       bookClauses.push(`service_mode_code IN (${filters.serviceMode.map(v => `'${v}'`).join(",")})`);
    if (!filters.allTime) {
        if (filters.dateStart) bookClauses.push(`month >= '${toYYYYMM(filters.dateStart)}'`);
        if (filters.dateEnd)   bookClauses.push(`month <= '${toYYYYMM(filters.dateEnd)}'`);
    }
    const bw = bookClauses.length > 0 ? `WHERE ${bookClauses.join(" AND ")}` : "";

    // ── mv_student_risk_score: structural + latest_recorded_at ONLY ───────────
    const riskClauses: string[] = [];
    if (filters.universityIds?.length) riskClauses.push(`university_id IN (${filters.universityIds.join(",")})`);
    if (!filters.allTime) {
        if (filters.dateStart) riskClauses.push(`latest_recorded_at >= '${toDateStr(filters.dateStart)}'`);
        if (filters.dateEnd)   riskClauses.push(`latest_recorded_at <= '${toDateStr(filters.dateEnd)} 23:59:59'`);
    }
    const rw = riskClauses.length > 0 ? `WHERE ${riskClauses.join(" AND ")}` : "";

    return { studentWhere: sw, bookingWhere: bw, riskWhere: rw };
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
