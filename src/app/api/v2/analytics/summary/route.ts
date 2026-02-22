// src/app/api/v2/analytics/summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { getRectorSummary } from "@/services/dashboards/handlers/rectorAnalytics";
import { getDeanSummary } from "@/services/dashboards/handlers/deanAnalytics";
import { getAdvisorSummary } from "@/services/dashboards/handlers/advisorAnalytics";
import type { AnalyticsParams } from "@/features/dashboard/shared/analytics-types";

const ALLOWED_ROLES = ["RECTOR", "DEAN", "ADVISOR", "HEAD_CONSULTANT", "SUPER_ADMIN", "MINISTRY"] as const;

function parseParams(url: URL): AnalyticsParams {
    const sp = url.searchParams;

    // Date defaults: current month
    const now = new Date();
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const allTime = sp.get("all_time") === "true";

    // booking_status multi-value
    const statusRaw = sp.get("booking_status");
    const bookingStatus = statusRaw ? statusRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

    return {
        date_start: sp.get("date_start") || defaultStart,
        date_end: sp.get("date_end") || defaultEnd,
        all_time: allTime,
        region_id: sp.get("region_id") ? Number(sp.get("region_id")) : undefined,
        province_id: sp.get("province_id") ? Number(sp.get("province_id")) : undefined,
        university_type: sp.get("university_type") || undefined,
        university_id: sp.get("university_id") ? Number(sp.get("university_id")) : undefined,
        university_code: sp.get("university_code") || undefined,
        faculty_id: sp.get("faculty_id") ? Number(sp.get("faculty_id")) : undefined,
        faculty_code: sp.get("faculty_code") || undefined,
        department_id: sp.get("department_id") ? Number(sp.get("department_id")) : undefined,
        gender: sp.get("gender") || undefined,
        problem_category_id: sp.get("problem_category_id") ? Number(sp.get("problem_category_id")) : undefined,
        booking_status: bookingStatus,
        service_mode: sp.get("service_mode") || undefined,
        online_channel_category_id: sp.get("online_channel_category_id")
            ? Number(sp.get("online_channel_category_id"))
            : undefined,
    };
}

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant(req);
        assertRole(tenant.role, [...ALLOWED_ROLES]);

        const params = parseParams(new URL(req.url));

        let data;
        let targetUniversityId = tenant.universityId;

        // Allow MINISTRY and SUPER_ADMIN to query specific university data
        if ((tenant.role === "MINISTRY" || tenant.role === "SUPER_ADMIN") && params.university_code) {
            const { prisma } = await import("@/lib/prisma");
            const u = await prisma.university.findUnique({
                where: { university_code: params.university_code },
                select: { university_id: true }
            });
            if (u) {
                targetUniversityId = u.university_id;
            }
        }

        switch (tenant.role) {
            case "DEAN":
                data = await getDeanSummary(tenant.accountId, targetUniversityId, params);
                break;

            case "ADVISOR":
                data = await getAdvisorSummary(tenant.accountId, params);
                break;

            case "MINISTRY":
            case "SUPER_ADMIN": {
                // For national roles, we need to build scope with their actual role
                const { buildScopeClause, runAnalytics } = await import("@/services/dashboards/handlers/analyticsService");
                const scope = await buildScopeClause(tenant.role, tenant.accountId, targetUniversityId || 0);

                // If university is specified, drill down to faculty, else group by university
                const groupLevel = params.university_id || params.university_code ? "faculty" : "university";
                data = await runAnalytics(scope, params, groupLevel as any);
                break;
            }

            // RECTOR, HEAD_CONSULTANT, CONSULTANT
            default:
                data = await getRectorSummary(tenant.accountId, targetUniversityId, params);
                break;
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        const status = error?.status || 500;
        console.error("[ANALYTICS_SUMMARY]", error?.message || error);
        return NextResponse.json(
            { success: false, error: error?.message || "Internal Server Error" },
            { status },
        );
    }
}
