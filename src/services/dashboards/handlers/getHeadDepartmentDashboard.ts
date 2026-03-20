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

function toYYYYMM(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function toDateStr(d: Date): string {
    return d.toISOString().split("T")[0];
}

function buildScopeWhere(
    departmentId: number,
    universityId: number,
    facultyId: number,
    filters: HeadDeptFilters,
) {
    // ── mv_student_summary: structural + profile columns ──────────────────────
    const studentClauses: string[] = [
        `university_id = ${universityId}`,
        `faculty_id = ${facultyId}`,
        `department_id = ${departmentId}`,
    ];
    if (filters.advisorId?.length)     studentClauses.push(`advisor_id IN (${filters.advisorId.join(",")})`);
    if (filters.gender?.length)        studentClauses.push(`gender_code IN (${filters.gender.map(g => `'${g}'`).join(",")})`);
    if (filters.familyIncomeBracket?.length) studentClauses.push(`income_bracket_code IN (${filters.familyIncomeBracket.map(v => `'${v}'`).join(",")})`);
    if (filters.bloodGroup?.length)    studentClauses.push(`blood_group_code IN (${filters.bloodGroup.map(v => `'${v}'`).join(",")})`);
    if (filters.parentalStatus?.length) studentClauses.push(`parental_status_code IN (${filters.parentalStatus.map(v => `'${v}'`).join(",")})`);
    const w = `WHERE ${studentClauses.join(" AND ")}`;

    // ── mv_booking_summary: structural + month + problem_category_id + booking_status + service_mode_code ─
    const bookClauses: string[] = [
        `university_id = ${universityId}`,
        `faculty_id = ${facultyId}`,
        `department_id = ${departmentId}`,
    ];
    if (filters.advisorId?.length)        bookClauses.push(`advisor_id IN (${filters.advisorId.join(",")})`);
    if (filters.problemCategoryIds?.length) bookClauses.push(`problem_category_id IN (${filters.problemCategoryIds.join(",")})`);
    if (filters.bookingStatus?.length)    bookClauses.push(`booking_status IN (${filters.bookingStatus.map(v => `'${v}'`).join(",")})`);
    if (filters.serviceMode?.length)      bookClauses.push(`service_mode_code IN (${filters.serviceMode.map(v => `'${v}'`).join(",")})`);
    if (!filters.allTime) {
        if (filters.dateStart) bookClauses.push(`month >= '${toYYYYMM(filters.dateStart)}'`);
        if (filters.dateEnd)   bookClauses.push(`month <= '${toYYYYMM(filters.dateEnd)}'`);
    }
    const bw = `WHERE ${bookClauses.join(" AND ")}`;

    // ── mv_student_risk_score: structural + latest_recorded_at ONLY ───────────
    const riskClauses: string[] = [
        `university_id = ${universityId}`,
        `faculty_id = ${facultyId}`,
        `department_id = ${departmentId}`,
    ];
    if (filters.advisorId?.length) riskClauses.push(`advisor_id IN (${filters.advisorId.join(",")})`);
    if (!filters.allTime) {
        if (filters.dateStart) riskClauses.push(`latest_recorded_at >= '${toDateStr(filters.dateStart)}'`);
        if (filters.dateEnd)   riskClauses.push(`latest_recorded_at <= '${toDateStr(filters.dateEnd)} 23:59:59'`);
    }
    const rw = `WHERE ${riskClauses.join(" AND ")}`;

    return { studentWhere: w, bookingWhere: bw, riskWhere: rw };
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
