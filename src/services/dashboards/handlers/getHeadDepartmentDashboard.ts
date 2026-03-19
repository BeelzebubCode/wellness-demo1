// src/services/dashboards/handlers/getHeadDepartmentDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Department-scoped analytics — powered by Materialized Views
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { queryAllStories, type StoryType } from "./queryDashboardMVs";

export type { StoryType };

export interface HeadDeptFilters {
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
    birthOrder?: string[];
    chronicConditionIds?: number[];
    parentalStatus?: string[];
    advisorId?: number[];
}

function buildScopeWhere(
    departmentId: number,
    universityId: number,
    facultyId: number,
    filters: HeadDeptFilters,
) {
    const clauses: string[] = [
        `university_id = ${universityId}`,
        `faculty_id = ${facultyId}`,
        `department_id = ${departmentId}`,
    ];
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
    if (filters.chronicConditionIds?.length) {
        clauses.push(`chronic_condition_ids && ARRAY[${filters.chronicConditionIds.join(",")}]::int[]`);
    }
    if (filters.advisorId?.length) {
        clauses.push(`advisor_id IN (${filters.advisorId.join(",")})`);
    }

    const w = `WHERE ${clauses.join(" AND ")}`;
    const bookClauses: string[] = [
        `university_id = ${universityId}`,
        `faculty_id = ${facultyId}`,
        `department_id = ${departmentId}`,
    ];
    if (filters.chronicConditionIds?.length) {
        bookClauses.push(`chronic_condition_ids && ARRAY[${filters.chronicConditionIds.join(",")}]::int[]`);
    }
    if (filters.advisorId?.length) {
        bookClauses.push(`advisor_id IN (${filters.advisorId.join(",")})`);
    }
    const bw = `WHERE ${bookClauses.join(" AND ")}`;
    return { studentWhere: w, bookingWhere: bw, riskWhere: bw };
}

export const HeadDepartmentService = {
    async getDepartmentStoryStats(
        departmentId: number,
        universityId: number,
        facultyId: number,
        filters: HeadDeptFilters = {},
        story: StoryType = "all",
    ) {
        const startTime = Date.now();

        const [deptInfo, advisors] = await Promise.all([
            prisma.department.findFirst({
                where: { department_id: departmentId, university_id: universityId },
                select: {
                    department_name_th: true, department_name_en: true, department_code: true,
                    faculty: {
                        select: {
                            faculty_name_th: true,
                            university: { select: { university_name_th: true } },
                        },
                    },
                },
            }),
            prisma.advisor.findMany({
                where: { department_id: departmentId, university_id: universityId },
                select: {
                    advisor_id: true,
                    advisor_prefix: true,
                    advisor_first_name: true,
                    advisor_last_name: true,
                    account: { select: { account_username: true } },
                },
                orderBy: { advisor_first_name: "asc" },
            }),
        ]);

        const scope = buildScopeWhere(departmentId, universityId, facultyId, filters);
        const stories = await queryAllStories(scope, story);

        const elapsed = Date.now() - startTime;
        console.log(`[HEAD_DEPT_MV] story=${story} took ${elapsed}ms`);

        return {
            department: {
                nameTh: deptInfo?.department_name_th ?? "",
                nameEn: deptInfo?.department_name_en ?? "",
                code: deptInfo?.department_code ?? "",
                facultyNameTh: deptInfo?.faculty?.faculty_name_th ?? "",
                universityNameTh: deptInfo?.faculty?.university?.university_name_th ?? "",
            },
            advisors: advisors.map(a => ({
                id: a.advisor_id,
                username: a.account?.account_username ?? "",
                name: `${a.advisor_prefix ?? ""}${a.advisor_first_name} ${a.advisor_last_name}`.trim(),
            })),
            ...stories,
        };
    },
};
