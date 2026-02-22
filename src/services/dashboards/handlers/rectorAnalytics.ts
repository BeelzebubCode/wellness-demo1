// src/services/dashboards/handlers/rectorAnalytics.ts

import prisma from "@/lib/prisma";
import { buildScopeClause, runAnalytics } from "./analyticsService";
import type { AnalyticsParams, AnalyticsResult, FacultyOption } from "@/features/dashboard/shared/analytics-types";

export async function getRectorSummary(
    accountId: number,
    universityId: number,
    params: AnalyticsParams,
): Promise<AnalyticsResult> {
    const scope = await buildScopeClause("RECTOR", accountId, universityId);

    // If faculty_id is given → drilldown to department level
    const groupLevel = params.faculty_id ? "department" : "faculty";

    return runAnalytics(scope, params, groupLevel);
}

export async function getFacultyList(universityId: number): Promise<FacultyOption[]> {
    const rows = await prisma.faculty.findMany({
        where: { university_id: universityId },
        select: {
            faculty_id: true,
            faculty_code: true,
            faculty_name_th: true,
            faculty_name_en: true,
        },
        orderBy: { faculty_code: "asc" },
    });

    return rows.map((r) => ({
        facultyId: r.faculty_id,
        facultyCode: r.faculty_code,
        facultyNameTh: r.faculty_name_th,
        facultyNameEn: r.faculty_name_en,
    }));
}
