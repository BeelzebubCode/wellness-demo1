// src/app/api/cron/expire-borrow-assignments/route.ts
//
// Manual trigger or cron endpoint for auto-completing expired borrow assignments.
// Also called lazily from assignBooking — this endpoint is just a manual fallback.

import { NextResponse } from "next/server";
import { autoExpireAssignments } from "@/services/borrow-requests";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const completed = await autoExpireAssignments();

        return NextResponse.json({
            ok: true,
            message: completed > 0
                ? `Completed ${completed} expired borrow assignment(s)`
                : "No expired assignments found",
            completed,
        });
    } catch (error) {
        console.error("[CRON_EXPIRE_BORROW_ERROR]", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
