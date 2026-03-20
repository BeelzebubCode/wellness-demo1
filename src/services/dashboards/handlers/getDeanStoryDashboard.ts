// src/services/dashboards/handlers/getDeanStoryDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Faculty-scoped analytics — powered by Materialized Views
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { queryAllStories, type StoryType } from "./queryDashboardMVs";

export type { StoryType };

export interface DeanFilters {
    dateStart?: Date;
    dateEnd?: Date;
    allTime?: boolean;
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
    advisorId?: number[];
}

function toYYYYMM(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function toDateStr(d: Date): string {
    return d.toISOString().split("T")[0];
}

function buildScopeWhere(universityId: number, facultyId: number, filters: DeanFilters) {
    // ── mv_student_summary: structural + profile columns ──────────────────────
    const studentClauses: string[] = [
        `university_id = ${universityId}`,
        `faculty_id = ${facultyId}`,
    ];
    if (filters.departmentIds?.length) studentClauses.push(`department_id IN (${filters.departmentIds.join(",")})`);
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
    ];
    if (filters.departmentIds?.length)    bookClauses.push(`department_id IN (${filters.departmentIds.join(",")})`);
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
    ];
    if (filters.departmentIds?.length) riskClauses.push(`department_id IN (${filters.departmentIds.join(",")})`);
    if (filters.advisorId?.length)     riskClauses.push(`advisor_id IN (${filters.advisorId.join(",")})`);
    if (!filters.allTime) {
        if (filters.dateStart) riskClauses.push(`latest_recorded_at >= '${toDateStr(filters.dateStart)}'`);
        if (filters.dateEnd)   riskClauses.push(`latest_recorded_at <= '${toDateStr(filters.dateEnd)} 23:59:59'`);
    }
    const rw = `WHERE ${riskClauses.join(" AND ")}`;

    return { studentWhere: w, bookingWhere: bw, riskWhere: rw };
}

export const DeanStoryService = {
    async getFacultyStoryStats(
        facultyId: number,
        universityId: number,
        filters: DeanFilters = {},
        story: StoryType = "all",
    ) {
        const startTime = Date.now();

        const [facultyInfo, departments] = await Promise.all([
            prisma.faculty.findFirst({
                where: { faculty_id: facultyId, university_id: universityId },
                select: {
                    faculty_name_th: true, faculty_name_en: true, faculty_code: true,
                    university: { select: { university_name_th: true } },
                },
            }),
            prisma.department.findMany({
                where: { faculty_id: facultyId, university_id: universityId },
                select: { department_id: true, department_name_th: true, department_code: true },
                orderBy: { department_name_th: "asc" },
            }),
        ]);

        const scope = buildScopeWhere(universityId, facultyId, filters);
        const stories = await queryAllStories(scope, story);

        // ── Per-department consultation count ──
        let departmentBookings: { id: number; nameTh: string; code: string; count: number }[] = [];
        if (story === "all" || story === "departments") {
            const raw = await prisma.$queryRawUnsafe<
                { department_id: number; count: number }[]
            >(`
                SELECT department_id, SUM(total_bookings)::int AS count
                FROM mv_booking_summary ${scope.bookingWhere}
                GROUP BY department_id
                ORDER BY count DESC
            `);

            const deptMap = new Map(departments.map(d => [d.department_id, d]));
            departmentBookings = raw
                .filter(r => deptMap.has(r.department_id))
                .map(r => {
                    const d = deptMap.get(r.department_id)!;
                    return {
                        id: r.department_id,
                        nameTh: d.department_name_th,
                        code: d.department_code ?? "",
                        count: r.count ?? 0,
                    };
                });

            // Add departments with 0 bookings
            for (const d of departments) {
                if (!departmentBookings.find(db => db.id === d.department_id)) {
                    departmentBookings.push({
                        id: d.department_id,
                        nameTh: d.department_name_th,
                        code: d.department_code ?? "",
                        count: 0,
                    });
                }
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[DEAN_MV] story=${story} took ${elapsed}ms`);

        return {
            faculty: {
                nameTh: facultyInfo?.faculty_name_th ?? "",
                nameEn: facultyInfo?.faculty_name_en ?? "",
                code: facultyInfo?.faculty_code ?? "",
                universityNameTh: facultyInfo?.university?.university_name_th ?? "",
            },
            departments: departments.map(d => ({
                id: d.department_id, nameTh: d.department_name_th, code: d.department_code,
            })),
            departmentBookings,
            ...stories,
        };
    },
};
