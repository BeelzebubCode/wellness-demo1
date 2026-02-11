// src/app/api/v2/consultant/borrowed-assignments/[id]/complete/route.ts

import { NextRequest } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { consultantCompleteBorrowAssignment } from "@/services/borrowRequests";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { account } = await requireTenant(req);
        assertRole(account.role, ["CONSULTANT"]);

        const { id } = await params;
        const borrowAssignmentId = Number(id);
        if (!Number.isFinite(borrowAssignmentId)) {
            return Response.json(
                { ok: false, error: "Invalid assignment ID" },
                { status: 400 }
            );
        }

        const result = await consultantCompleteBorrowAssignment({
            accountId: account.accountId,
            borrowAssignmentId,
        });

        return Response.json({ ok: true, data: result });
    } catch (error: any) {
        console.error("Error completing borrow assignment:", error);

        const statusMap: Record<string, number> = {
            CONSULTANT_NOT_FOUND: 404,
            ASSIGNMENT_NOT_FOUND: 404,
            FORBIDDEN: 403,
            ONLY_ASSIGNED_CAN_COMPLETE: 400,
        };

        const status = statusMap[error.message] || 500;
        const message = error.message || "Internal server error";

        return Response.json({ ok: false, error: message }, { status });
    }
}
