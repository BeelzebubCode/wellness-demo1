// src/app/api/v2/dashboards/refresh/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v2/dashboards/refresh — Manual MV refresh (admin only)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth/token";
import { refreshDashboardMVs } from "@/services/dashboards/refreshMaterializedViews";

export async function POST(req: NextRequest) {
    try {
        // Auth check — only MINISTRY or SUPER_ADMIN
        const token = extractToken(req);
        if (!token) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Invalid token" },
                { status: 401 }
            );
        }

        const allowedRoles = ["MINISTRY", "SUPER_ADMIN"];
        if (!allowedRoles.includes(payload.role)) {
            return NextResponse.json(
                { success: false, error: "Forbidden — admin only" },
                { status: 403 }
            );
        }

        const result = await refreshDashboardMVs();

        return NextResponse.json({
            success: result.success,
            data: {
                refreshed: result.refreshed,
                elapsed: `${result.elapsed}ms`,
            },
            ...(result.error ? { error: result.error } : {}),
        });
    } catch (error: any) {
        console.error("[REFRESH_API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
