import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { account, activeUniversityId } = await requireTenant(req);

        // Only consultants and head consultants can access their own assignments
        assertRole(account.role, ["CONSULTANT", "HEAD_CONSULTANT"]);

        // Find the consultant record for this account
        const consultant = await prisma.consultant.findFirst({
            where: { account_id: account.accountId },
            select: { consultant_id: true, university_id: true },
        });

        if (!consultant) {
            return NextResponse.json({ success: true, data: { count: 0 } });
        }

        const where: any = {
            university_id: activeUniversityId,
            booking_status: BookingStatus.ASSIGNED, // Only counting "รอดำเนินการ"
            OR: [
                { consultant_id: consultant.consultant_id },
                {
                    assignments: {
                        some: {
                            consultant_id: consultant.consultant_id,
                            consultant_university_id: consultant.university_id,
                        },
                    },
                },
            ],
        };

        const count = await prisma.booking.count({ where });

        return NextResponse.json({
            success: true,
            data: { count },
        });
    } catch (err: any) {
        console.error("[GET /api/v2/consultants/me/bookings/assigned-count]", err);
        return NextResponse.json(
            { error: err?.message ?? "Failed to get assigned count" },
            { status: err?.status ?? 500 }
        );
    }
}
