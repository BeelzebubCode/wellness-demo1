// src/services/dashboards/refreshMaterializedViews.ts
// ─────────────────────────────────────────────────────────────────────────────
// Refresh dashboard materialized views
// Uses CONCURRENTLY to avoid blocking reads during refresh
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";

const MV_NAMES = [
    "mv_student_summary",
    "mv_booking_summary",
    "mv_risk_summary",
] as const;

export async function refreshDashboardMVs(): Promise<{
    success: boolean;
    refreshed: string[];
    elapsed: number;
    error?: string;
}> {
    const startTime = Date.now();
    const refreshed: string[] = [];

    try {
        for (const mv of MV_NAMES) {
            const mvStart = Date.now();
            await prisma.$executeRawUnsafe(
                `REFRESH MATERIALIZED VIEW CONCURRENTLY ${mv}`
            );
            const mvElapsed = Date.now() - mvStart;
            console.log(`[MV_REFRESH] ${mv} refreshed in ${mvElapsed}ms`);
            refreshed.push(mv);
        }

        const elapsed = Date.now() - startTime;
        console.log(`[MV_REFRESH] All MVs refreshed in ${elapsed}ms`);
        return { success: true, refreshed, elapsed };
    } catch (error: any) {
        const elapsed = Date.now() - startTime;
        console.error(`[MV_REFRESH] Failed after ${elapsed}ms:`, error);
        return {
            success: false,
            refreshed,
            elapsed,
            error: error.message,
        };
    }
}
