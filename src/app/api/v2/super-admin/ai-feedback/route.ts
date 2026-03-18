import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";

// GET - list all AI feedback events
export async function GET(request: NextRequest) {
    try {
        const auth = await requireSuperAdmin(request);
        if (!auth.ok) return NextResponse.json({ valid: false, message: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

        const where: any = {};
        if (status && ["OPEN", "RESOLVED", "IGNORED"].includes(status)) {
            where.ai_feedback_status = status;
        }

        const [total, items] = await Promise.all([
            prisma.aiFeedbackEvent.count({ where }),
            prisma.aiFeedbackEvent.findMany({
                where,
                orderBy: { ai_created_at: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    account: {
                        select: {
                            account_id: true,
                            account_username: true,
                            roleCategory: { select: { code: true } },
                        },
                    },
                    university: { select: { university_name_th: true } },
                },
            }),
        ]);

        return NextResponse.json({ valid: true, data: items, total, page, limit });
    } catch (error) {
        return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 });
    }
}

// PATCH - update feedback status
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireSuperAdmin(request);
        if (!auth.ok) return NextResponse.json({ valid: false, message: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { id, status } = body;

        if (!id || !["OPEN", "RESOLVED", "IGNORED"].includes(status)) {
            return NextResponse.json({ valid: false, message: "Invalid payload" }, { status: 400 });
        }

        const updated = await prisma.aiFeedbackEvent.update({
            where: { ai_feedback_event_id: Number(id) },
            data: { ai_feedback_status: status },
        });

        return NextResponse.json({ valid: true, data: updated });
    } catch (error) {
        return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 });
    }
}
