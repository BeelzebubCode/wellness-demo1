// src/services/dashboards/handlers/getRectorStoryDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// University-scoped analytics — powered by Materialized Views
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { queryAllStories, type StoryType } from "./queryDashboardMVs";

export type { StoryType };

export interface RectorFilters {
    dateStart?: Date;
    dateEnd?: Date;
    allTime?: boolean;
    facultyIds?: number[];
    departmentIds?: number[];
    gender?: string[];
    problemCategoryIds?: number[];
    serviceMode?: string[];
    bookingStatus?: string[];
    attendanceStatus?: string[];
    familyIncomeBracket?: string[];
    bloodGroup?: string[];
    birthOrder?: string[];
    chronicConditionIds?: number[];
    parentalStatus?: string[];
}

function buildScopeWhere(universityId: number, filters: RectorFilters) {
    const clauses: string[] = [`university_id = ${universityId}`];
    if (filters.facultyIds?.length) {
        clauses.push(`faculty_id IN (${filters.facultyIds.join(",")})`);
    }
    if (filters.departmentIds?.length) {
        clauses.push(`department_id IN (${filters.departmentIds.join(",")})`);
    }
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
    // Booking/risk MVs don't have profile codes, just scope IDs
    const bookClauses: string[] = [`university_id = ${universityId}`];
    if (filters.facultyIds?.length) bookClauses.push(`faculty_id IN (${filters.facultyIds.join(",")})`);
    if (filters.departmentIds?.length) bookClauses.push(`department_id IN (${filters.departmentIds.join(",")})`);
    const bw = `WHERE ${bookClauses.join(" AND ")}`;
    return { studentWhere: w, bookingWhere: bw, riskWhere: bw };
}

export const RectorStoryService = {
    async getUniversityStoryStats(
        universityId: number,
        filters: RectorFilters = {},
        story: StoryType = "all",
    ) {
        const startTime = Date.now();

        const [uniInfo, faculties] = await Promise.all([
            prisma.university.findUnique({
                where: { university_id: universityId },
                select: { university_name_th: true, university_name_en: true, university_code: true },
            }),
            prisma.faculty.findMany({
                where: { university_id: universityId },
                select: { faculty_id: true, faculty_name_th: true, faculty_code: true },
                orderBy: { faculty_name_th: "asc" },
            }),
        ]);

        const scope = buildScopeWhere(universityId, filters);
        const stories = await queryAllStories(scope, story);

        const elapsed = Date.now() - startTime;
        console.log(`[RECTOR_MV] story=${story} took ${elapsed}ms`);

        return {
            university: {
                nameTh: uniInfo?.university_name_th ?? "",
                nameEn: uniInfo?.university_name_en ?? "",
                code: uniInfo?.university_code ?? "",
            },
            faculties: faculties.map(f => ({ id: f.faculty_id, nameTh: f.faculty_name_th, code: f.faculty_code })),
            ...stories,
        };
    },
};
