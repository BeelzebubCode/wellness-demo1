import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant(req);
        if (tenant.role !== "MINISTRY" && tenant.role !== "SUPER_ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized for national data" }, { status: 403 });
        }

        const rows = await prisma.region.findMany({
            select: {
                region_id: true,
                region_code: true,
                region_name_th: true,
                region_name_en: true,
            },
            orderBy: { region_name_th: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: rows,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || "Internal Server Error" },
            { status: error?.status || 500 },
        );
    }
}
