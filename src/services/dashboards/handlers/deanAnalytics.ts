// src/services/dashboards/handlers/deanAnalytics.ts

import prisma from "@/lib/prisma";
import { buildScopeClause, runAnalytics } from "./analyticsService";
import type { AnalyticsParams, AnalyticsResult, FacultyOption } from "@/features/dashboard/shared/analytics-types";

export async function getDeanSummary(
    accountId: number,
    universityId: number,
    params: AnalyticsParams,
): Promise<AnalyticsResult> {
    const scope = await buildScopeClause("DEAN", accountId, universityId);

    // Dean always sees department-level (their faculties are pre-scoped)
    return runAnalytics(scope, params, "department");
}

export async function getDeanFaculties(accountId: number): Promise<FacultyOption[]> {
    const rows = await prisma.faculty.findMany({
        where: { dean_account_id: accountId },
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
