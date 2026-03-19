// src/app/api/v2/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccountFromRequest } from "@/lib/auth/context";

// GET — list notifications for current user
export async function GET(req: NextRequest) {
    try {
        const ctx = await getAccountFromRequest(req);
        if (!ctx) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const sp = req.nextUrl.searchParams;
        const limit = Math.min(parseInt(sp.get("limit") || "20"), 50);
        const offset = parseInt(sp.get("offset") || "0") || 0;
        const unreadOnly = sp.get("unread") === "true";

        const where: any = { account_id: ctx.accountId };
        if (unreadOnly) {
            where.notification_read_at = null;
        }

        const [total, items] = await Promise.all([
            prisma.notification.count({ where }),
            prisma.notification.findMany({
                where,
                orderBy: { notification_created_at: "desc" },
                skip: offset,
                take: limit,
                include: {
                    template: {
                        select: {
                            notification_template_code: true,
                            notification_template_icon: true,
                            notification_template_category: true,
                        },
                    },
                },
            }),
        ]);

        const data = items.map((n) => ({
            id: n.notification_id,
            title: n.notification_title ?? n.template.notification_template_code,
            body: n.notification_body ?? null,
            icon: n.template.notification_template_icon,
            category: n.template.notification_template_category,
            templateCode: n.template.notification_template_code,
            bookingId: n.booking_id,
            universityId: n.university_id,
            data: n.notification_data,
            readAt: n.notification_read_at?.toISOString() ?? null,
            createdAt: n.notification_created_at.toISOString(),
        }));

        return NextResponse.json({ success: true, data, total, limit, offset });
    } catch (error) {
        console.error("[NOTIFICATIONS_GET_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// PATCH — mark notification(s) as read
export async function PATCH(req: NextRequest) {
    try {
        const ctx = await getAccountFromRequest(req);
        if (!ctx) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, markAll } = body;
        const now = new Date();

        if (markAll) {
            // Mark all unread as read
            const result = await prisma.notification.updateMany({
                where: { account_id: ctx.accountId, notification_read_at: null },
                data: { notification_read_at: now },
            });
            return NextResponse.json({ success: true, updated: result.count });
        }

        if (typeof id === "number") {
            // Mark single notification as read
            await prisma.notification.updateMany({
                where: { notification_id: id, account_id: ctx.accountId },
                data: { notification_read_at: now },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "id or markAll required" }, { status: 400 });
    } catch (error) {
        console.error("[NOTIFICATIONS_PATCH_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
