// src/app/api/v2/notifications/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccountFromRequest } from "@/lib/auth/context";

// GET — return unread notification count for bell badge
export async function GET(req: NextRequest) {
    try {
        const ctx = await getAccountFromRequest(req);
        if (!ctx) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const count = await prisma.notification.count({
            where: {
                account_id: ctx.accountId,
                notification_read_at: null,
            },
        });

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("[NOTIFICATIONS_COUNT_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
