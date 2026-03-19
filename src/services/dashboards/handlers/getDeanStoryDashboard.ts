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

function buildScopeWhere(universityId: number, facultyId: number, filters: DeanFilters) {
    const clauses: string[] = [
        `university_id = ${universityId}`,
        `faculty_id = ${facultyId}`,
    ];
    if (filters.departmentIds?.length) {
        clauses.push(`department_id IN (${filters.departmentIds.join(",")})`);
    }
    if (filters.advisorId?.length) {
        clauses.push(`advisor_id IN (${filters.advisorId.join(",")})`);
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
    if (filters.chronicConditionIds?.length) {
        // Correct PostgreSQL syntax for array intersection
        clauses.push(`chronic_condition_ids && ARRAY[${filters.chronicConditionIds.join(",")}]::int[]`);
    }

    const w = `WHERE ${clauses.join(" AND ")}`;

    // Booking clauses (can follow common filters)
    const bookClauses: string[] = [...clauses];
    if (filters.serviceMode?.length) {
        bookClauses.push(`service_mode_code IN (${filters.serviceMode.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.bookingStatus?.length) {
        bookClauses.push(`booking_status IN (${filters.bookingStatus.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.attendanceStatus?.length) {
        bookClauses.push(`booking_attendance_status IN (${filters.attendanceStatus.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.problemCategoryIds?.length) {
        bookClauses.push(`problem_category_id IN (${filters.problemCategoryIds.join(",")})`);
    }

    const bw = `WHERE ${bookClauses.join(" AND ")}`;

    // Risk clauses (scoped to COMPLETED bookings usually, but scope filters apply)
    const riskClauses: string[] = [...clauses];
    if (filters.problemCategoryIds?.length) {
        riskClauses.push(`problem_category_id IN (${filters.problemCategoryIds.join(",")})`);
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
                FROM mv_booking_summary
                WHERE university_id = ${universityId} AND faculty_id = ${facultyId}
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
