// src/app/api/v2/consultant/borrowed-assignments/route.ts

import { NextRequest } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { consultantListBorrowedAssignments } from "@/services/borrowRequests";

export async function GET(req: NextRequest) {
    try {
        const { account } = await requireTenant(req);
        assertRole(account.role, ["CONSULTANT"]);

        const data = await consultantListBorrowedAssignments({
            accountId: account.accountId,
        });

        return Response.json({ ok: true, data });
    } catch (error: any) {
        console.error("Error listing borrowed assignments:", error);

        if (error.message === "CONSULTANT_NOT_FOUND") {
            return Response.json(
                { ok: false, error: "Consultant not found" },
                { status: 404 }
            );
        }

        // Handle tenant/auth errors
        if (error.message?.includes("TENANT") || error.message?.includes("UNAUTHORIZED")) {
            return Response.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        return Response.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
