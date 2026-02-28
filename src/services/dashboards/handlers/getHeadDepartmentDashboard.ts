// src/services/dashboards/handlers/getHeadDepartmentDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Department-scoped analytics with story-based data scoping
// Each "story" returns only the data that story card needs
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";

export type StoryType =
    | "students"     // ภาพรวมนิสิต — consulted vs not
    | "bookings"     // การใช้บริการ
    | "problems"     // ประเด็นปัญหา + โปรไฟล์นิสิต (merged: health + family + problems)
    | "risk"         // ความเสี่ยง
    | "all";         // all stories (legacy)

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
}

// ─── Helper: build student_id filter CTE ───────────────────────────────────
function buildStudentCte(
    departmentId: number,
    universityId: number,
    facultyId: number,
    filters: HeadDeptFilters,
): string {
    const clauses: string[] = [
        `sa.department_id = ${departmentId}`,
        `sa.university_id = ${universityId}`,
        `sa.faculty_id = ${facultyId}`,
    ];

    const joins: string[] = [];
    const profileClauses: string[] = [];
    let needsProfile = false;

    if (filters.gender?.length) {
        needsProfile = true;
        profileClauses.push(`sp.student_gender IN (${filters.gender.map(g => `'${g}'`).join(",")})`);
    }
    if (filters.familyIncomeBracket?.length) {
        needsProfile = true;
        profileClauses.push(`sp.family_income_bracket IN (${filters.familyIncomeBracket.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.bloodGroup?.length) {
        needsProfile = true;
        profileClauses.push(`sp.student_blood_group IN (${filters.bloodGroup.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.parentalStatus?.length) {
        needsProfile = true;
        profileClauses.push(`sp.parental_status IN (${filters.parentalStatus.map(v => `'${v}'`).join(",")})`);
    }
    if (filters.birthOrder?.length) {
        needsProfile = true;
        const ordClauses: string[] = [];
        for (const bo of filters.birthOrder) {
            if (bo === "ONLY_CHILD") ordClauses.push(`(sp.sibling_count = 1)`);
            else if (bo === "4_PLUS") ordClauses.push(`(sp.birth_order >= 4)`);
            else ordClauses.push(`(sp.birth_order = ${parseInt(bo)} AND sp.sibling_count > 1)`);
        }
        profileClauses.push(`(${ordClauses.join(" OR ")})`);
    }

    if (needsProfile) {
        joins.push(`JOIN student_profile sp ON sp.university_id = sa.university_id AND sp.student_id = sa.student_id`);
    }

    if (filters.chronicConditionIds?.length) {
        joins.push(`JOIN student_chronic_condition scc ON scc.university_id = sa.university_id AND scc.student_id = sa.student_id`);
        profileClauses.push(`scc.condition_category_id IN (${filters.chronicConditionIds.join(",")})`);
    }

    const joinStr = joins.join("\n    ");
    const whereStr = [...clauses, ...profileClauses].join("\n        AND ");

    return `SELECT DISTINCT sa.student_id, sa.university_id
    FROM student_academic sa
    ${joinStr}
    WHERE ${whereStr}`;
}

export const HeadDepartmentService = {
    async getDepartmentStats(
        departmentId: number,
        facultyId: number,
        universityId: number,
        filters: HeadDeptFilters = {},
        story: StoryType = "all",
    ) {
        // ── Meta (always needed) ────────────────────────────────────────────
        const deptInfo = await prisma.department.findFirst({
            where: { department_id: departmentId },
            select: {
                department_name_th: true,
                department_name_en: true,
                department_code: true,
                faculty: { select: { faculty_name_th: true } },
                university: { select: { university_name_th: true } },
            },
        });

        const studentCte = buildStudentCte(departmentId, universityId, facultyId, filters);

        // Date condition
        let dateWhere = "";
        if (!filters.allTime && filters.dateStart && filters.dateEnd) {
            const ds = filters.dateStart.toISOString().split("T")[0];
            const de = filters.dateEnd.toISOString().split("T")[0];
            dateWhere = `AND ts.time_slot_start_datetime >= '${ds}' AND ts.time_slot_start_datetime < '${de}'::date + INTERVAL '1 day'`;
        }
        let statusWhere = "";
        if (filters.bookingStatus?.length) {
            statusWhere = `AND b.booking_status IN (${filters.bookingStatus.map(s => `'${s}'`).join(",")})`;
        }
        let serviceModeWhere = "";
        if (filters.serviceMode?.length) {
            serviceModeWhere = `AND b.booking_service_mode IN (${filters.serviceMode.map(s => `'${s}'`).join(",")})`;
        }
        let attendanceWhere = "";
        if (filters.attendanceStatus?.length) {
            attendanceWhere = `AND ba.booking_attendance_status IN (${filters.attendanceStatus.map(s => `'${s}'`).join(",")})`;
        }
        const allBookingWhere = `${dateWhere} ${statusWhere} ${serviceModeWhere} ${attendanceWhere}`;

        const result: Record<string, any> = {
            department: {
                nameTh: deptInfo?.department_name_th ?? "",
                nameEn: deptInfo?.department_name_en ?? "",
                code: deptInfo?.department_code ?? "",
                facultyNameTh: deptInfo?.faculty?.faculty_name_th ?? "",
                universityNameTh: deptInfo?.university?.university_name_th ?? "",
            },
        };

        // ═══════════════════════════════════════════════════════════════════
        // STORY: students — ภาพรวมนิสิต (consulted vs not consulted)
        // ═══════════════════════════════════════════════════════════════════
        if (story === "students" || story === "all") {
            // Total students
            const totalR = await prisma.$queryRawUnsafe<{ count: number }[]>(`
                WITH filtered AS (${studentCte})
                SELECT COUNT(DISTINCT student_id)::int as count FROM filtered
            `);
            const totalStudents = totalR[0]?.count ?? 0;

            // How many of those have ever booked (within date range if filtered)
            const consultedR = await prisma.$queryRawUnsafe<{ count: number }[]>(`
                WITH filtered AS (${studentCte})
                SELECT COUNT(DISTINCT b.student_id)::int as count
                FROM filtered f
                JOIN booking b ON b.student_id = f.student_id AND b.university_id = f.university_id
                JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
                WHERE 1=1 ${dateWhere}
            `);
            const consultedCount = consultedR[0]?.count ?? 0;

            // Blood group distribution
            const bloodDist = await prisma.$queryRawUnsafe<{ group: string; count: number }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    COALESCE(sp.student_blood_group::text, 'UNKNOWN') as "group",
                    COUNT(*)::int as count
                FROM filtered f
                JOIN student_profile sp ON sp.university_id = f.university_id AND sp.student_id = f.student_id
                WHERE sp.student_blood_group IS NOT NULL
                GROUP BY sp.student_blood_group
                ORDER BY count DESC
            `);

            result.students = {
                totalStudents,
                consultedCount,
                neverConsultedCount: totalStudents - consultedCount,
                bloodDist: bloodDist.map(r => ({ label: r.group, count: r.count })),
            };
        }

        // ═══════════════════════════════════════════════════════════════════
        // STORY: bookings — การใช้บริการ
        // ═══════════════════════════════════════════════════════════════════
        if (story === "bookings" || story === "all") {
            const bookingStats = await prisma.$queryRawUnsafe<{
                total_bookings: number; checked_in: number;
                no_show: number; completed: number;
            }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    COUNT(b.booking_id)::int as total_bookings,
                    COUNT(CASE WHEN ba.booking_attendance_status = 'CHECKED_IN' THEN 1 END)::int as checked_in,
                    COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END)::int as no_show,
                    COUNT(CASE WHEN b.booking_status = 'COMPLETED' THEN 1 END)::int as completed
                FROM booking b
                JOIN filtered f ON f.student_id = b.student_id AND f.university_id = b.university_id
                JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
                LEFT JOIN booking_attendance ba ON ba.booking_id = b.booking_id AND ba.university_id = b.university_id
                WHERE 1=1 ${allBookingWhere}
            `);
            const bs = bookingStats[0] ?? { total_bookings: 0, checked_in: 0, no_show: 0, completed: 0 };

            // Monthly trend
            const monthlyTrend = await prisma.$queryRawUnsafe<{
                month: string; bookings: number; checked_in: number;
            }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM') as month,
                    COUNT(*)::int as bookings,
                    COUNT(CASE WHEN ba.booking_attendance_status = 'CHECKED_IN' THEN 1 END)::int as checked_in
                FROM filtered f
                JOIN booking b ON b.student_id = f.student_id AND b.university_id = f.university_id
                JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
                LEFT JOIN booking_attendance ba ON ba.booking_id = b.booking_id AND ba.university_id = b.university_id
                WHERE ts.time_slot_start_datetime >= NOW() - INTERVAL '12 months'
                GROUP BY 1 ORDER BY 1
            `);

            result.bookings = {
                totalBookings: bs.total_bookings,
                checkedInCount: bs.checked_in,
                noShowCount: bs.no_show,
                completedCount: bs.completed,
                monthlyTrend: monthlyTrend.map(r => ({ month: r.month, bookings: r.bookings, checkedIn: r.checked_in })),
            };
        }

        // ═══════════════════════════════════════════════════════════════════
        // STORY: problems — ประเด็นปัญหา + โปรไฟล์นิสิตที่มาปรึกษา
        //   (merged: health + family + problems → tells one actionable story)
        // ═══════════════════════════════════════════════════════════════════
        if (story === "problems" || story === "all") {
            // 1) Problem categories
            const problemDist = await prisma.$queryRawUnsafe<{
                category_name_th: string; count: number;
            }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    pc.problem_category_name_th as category_name_th,
                    COUNT(*)::int as count
                FROM filtered f
                JOIN booking b ON b.student_id = f.student_id AND b.university_id = f.university_id
                JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
                LEFT JOIN booking_attendance ba ON ba.booking_id = b.booking_id AND ba.university_id = b.university_id
                JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id
                WHERE b.problem_category_id IS NOT NULL ${allBookingWhere}
                GROUP BY pc.problem_category_name_th
                ORDER BY count DESC
            `);

            // 2) Income distribution of filtered students
            const incomeDist = await prisma.$queryRawUnsafe<{ bracket: string; count: number }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    COALESCE(sp.family_income_bracket::text, 'UNKNOWN') as bracket,
                    COUNT(*)::int as count
                FROM filtered f
                JOIN student_profile sp ON sp.university_id = f.university_id AND sp.student_id = f.student_id
                GROUP BY sp.family_income_bracket
                ORDER BY count DESC
            `);

            // 3) Chronic conditions of filtered students
            const chronicDist = await prisma.$queryRawUnsafe<{
                condition_name_th: string; condition_code: string; count: number;
            }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    cc.condition_name_th, cc.condition_code,
                    COUNT(DISTINCT scc.student_id)::int as count
                FROM filtered f
                JOIN student_chronic_condition scc ON scc.university_id = f.university_id AND scc.student_id = f.student_id
                JOIN chronic_condition_category cc ON cc.condition_category_id = scc.condition_category_id
                GROUP BY cc.condition_name_th, cc.condition_code
                ORDER BY count DESC
            `);

            // 4) Parental status of filtered students
            const parentalDist = await prisma.$queryRawUnsafe<{ status: string; count: number }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    COALESCE(sp.parental_status::text, 'UNKNOWN') as status,
                    COUNT(*)::int as count
                FROM filtered f
                JOIN student_profile sp ON sp.university_id = f.university_id AND sp.student_id = f.student_id
                WHERE sp.parental_status IS NOT NULL
                GROUP BY sp.parental_status
                ORDER BY count DESC
            `);

            // 5) Blood group of filtered students
            const bloodDist = await prisma.$queryRawUnsafe<{ group: string; count: number }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    COALESCE(sp.student_blood_group::text, 'UNKNOWN') as "group",
                    COUNT(*)::int as count
                FROM filtered f
                JOIN student_profile sp ON sp.university_id = f.university_id AND sp.student_id = f.student_id
                WHERE sp.student_blood_group IS NOT NULL
                GROUP BY sp.student_blood_group
                ORDER BY count DESC
            `);

            result.problems = {
                categories: problemDist.map(r => ({ label: r.category_name_th, count: r.count })),
                incomeDist: incomeDist.map(r => ({ label: r.bracket, count: r.count })),
                chronicDist: chronicDist.map(r => ({ label: r.condition_name_th, code: r.condition_code, count: r.count })),
                parentalDist: parentalDist.map(r => ({ label: r.status, count: r.count })),
                bloodDist: bloodDist.map(r => ({ label: r.group, count: r.count })),
            };
        }

        // ═══════════════════════════════════════════════════════════════════
        // STORY: risk — ความเสี่ยง
        // ═══════════════════════════════════════════════════════════════════
        if (story === "risk" || story === "all") {
            const riskDist = await prisma.$queryRawUnsafe<{
                risk_level: string; count: number;
            }[]>(`
                WITH filtered AS (${studentCte})
                SELECT
                    COALESCE(bo.booking_outcome_risk_level::text, 'UNKNOWN') as risk_level,
                    COUNT(DISTINCT b.booking_id)::int as count
                FROM filtered f
                JOIN booking b ON b.student_id = f.student_id AND b.university_id = f.university_id
                JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
                LEFT JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id
                WHERE b.booking_status = 'COMPLETED' ${dateWhere}
                GROUP BY bo.booking_outcome_risk_level
                ORDER BY count DESC
            `);

            result.risk = {
                distribution: riskDist.map(r => ({ label: r.risk_level, count: r.count })),
                highRiskCount: riskDist.find(r => r.risk_level === "HIGH")?.count ?? 0,
            };
        }

        return result;
    },
};
