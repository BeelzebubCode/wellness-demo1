// src/app/api/v2/consultant/borrowed-assignments/route.ts

import { NextRequest } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";
import { consultantListBorrowedAssignments } from "@/services/borrow-requests/handlers/consultantListBorrowedAssignments";

export async function GET(req: NextRequest) {
    try {
        const { account } = await requireTenant(req);
        assertRole(account.role, ["CONSULTANT"]);

        const data = await consultantListBorrowedAssignments({
            accountId: account.accountId,
        });

        // ✅ Fetch home university details for redirection
        let homeUniversity = null;
        if (account.homeUniversityId) {
            const u = await prisma.university.findUnique({
                where: { university_id: account.homeUniversityId },
                select: { university_id: true, university_code: true, university_name_th: true },
            });
            if (u) {
                homeUniversity = {
                    id: u.university_id,
                    code: u.university_code,
                    name: u.university_name_th,
                };
            }
        }

        return Response.json({ ok: true, data, homeUniversity });
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
            {
                ok: false,
                error: error?.message ?? "Internal server error",
                name: error?.name,
                code: error?.code,
            },
            { status: 500 }
        );
    }
}
