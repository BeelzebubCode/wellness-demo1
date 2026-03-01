import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { account, activeUniversityId } = await requireTenant(req);
        assertRole(account.role, ["HEAD_CONSULTANT", "COUNSELING_ADMIN", "SUPER_ADMIN"]);

        if (!activeUniversityId) {
            return NextResponse.json({ count: 0 });
        }

        const count = await prisma.booking.count({
            where: {
                university_id: activeUniversityId,
                booking_status: "PENDING_ASSIGNMENT",
            },
        });

        return NextResponse.json({ ok: true, data: { count } });
    } catch (e: any) {
        if (e?.name === "UnauthorizedError") {
            return NextResponse.json({ count: 0 }, { status: 401 });
        }
        console.error("[GET_PENDING_BOOKING_COUNT]", e);
        return NextResponse.json(
            { ok: false, error: e?.message ?? "Unknown error" },
            { status: 500 }
        );
    }
}
