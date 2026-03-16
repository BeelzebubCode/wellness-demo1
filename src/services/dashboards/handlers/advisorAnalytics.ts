// src/services/dashboards/handlers/advisorAnalytics.ts

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { buildScopeClause, buildFilterClause, runAnalytics } from "./analyticsService";
import type {
    AnalyticsParams,
    AnalyticsResult,
    StudentRankRow,
} from "@/features/dashboard/widgets/types/analytics-types";

export async function getAdvisorSummary(
    accountId: number,
    params: AnalyticsParams,
): Promise<AnalyticsResult> {
    // Advisor scope resolves university_id automatically
    const scope = await buildScopeClause("ADVISOR", accountId, 0);

    // Advisor sees department-level view of their students
    const result = await runAnalytics(scope, params, "department");

    // Add student rank
    const studentRank = await getStudentRank(
        scope.resolvedAdvisorId!,
        scope.universityId,
        params,
    );

    return { ...result, studentRank };
}

export async function getStudentRank(
    advisorId: number,
    universityId: number,
    params: AnalyticsParams,
): Promise<StudentRankRow[]> {
    const filterSQL = buildFilterClause(params);

    const rows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT
      s.student_id,
      s.student_code,
      sp.student_first_name_th AS first_name,
      sp.student_last_name_th AS last_name,
      gc.code AS gender,
      f.faculty_name_th AS faculty_name,
      d.department_name_th AS department_name,
      COUNT(b.booking_id)::int AS total_bookings,
      COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END)::int AS no_show_count,
      COUNT(CASE WHEN ba.booking_attendance_status = 'LATE' THEN 1 END)::int AS late_count,
      ROUND(AVG(bo.booking_outcome_risk_level)::numeric, 2) AS avg_risk,
      COUNT(CASE WHEN bo.booking_outcome_risk_level >= 4 THEN 1 END)::int AS high_risk_count,
      -- Composite risk score for ranking
      (
        COALESCE(AVG(bo.booking_outcome_risk_level), 0) * 2
        + COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END) * 3
        + COUNT(CASE WHEN ba.booking_attendance_status = 'LATE' THEN 1 END) * 1
      )::numeric AS risk_score
    FROM student_academic sa
    JOIN student s ON s.university_id = sa.university_id AND s.student_id = sa.student_id
    LEFT JOIN student_profile sp ON sp.university_id = sa.university_id AND sp.student_id = sa.student_id
    LEFT JOIN gender_category gc ON gc.gender_category_id = sp.gender_category_id
    LEFT JOIN faculty f ON f.university_id = sa.university_id AND f.faculty_id = sa.faculty_id
    LEFT JOIN department d ON d.university_id = sa.university_id AND d.department_id = sa.department_id
    LEFT JOIN booking b ON b.university_id = sa.university_id AND b.student_id = sa.student_id
    LEFT JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE sa.advisor_id = ${advisorId}
      AND sa.university_id = ${universityId}
      ${filterSQL}
    GROUP BY s.student_id, s.student_code, sp.student_first_name_th, sp.student_last_name_th,
             gc.code, f.faculty_name_th, d.department_name_th
    ORDER BY risk_score DESC
    LIMIT 50
    `,
    );

    return rows.map((r) => ({
        studentId: Number(r.student_id),
        studentCode: r.student_code,
        firstName: r.first_name || "",
        lastName: r.last_name || "",
        gender: r.gender,
        facultyName: r.faculty_name || "",
        departmentName: r.department_name || "",
        totalBookings: Number(r.total_bookings),
        noShowCount: Number(r.no_show_count),
        lateCount: Number(r.late_count),
        avgRisk: r.avg_risk != null ? Number(r.avg_risk) : null,
        highRiskCount: Number(r.high_risk_count),
        riskScore: Number(r.risk_score) || 0,
    }));
}
