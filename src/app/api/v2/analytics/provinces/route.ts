import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant(req);
        if (tenant.role !== "MINISTRY" && tenant.role !== "SUPER_ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized for national data" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const regionId = searchParams.get("region_id");

        const whereClause = regionId ? { region_id: Number(regionId) } : {};

        const rows = await prisma.province.findMany({
            where: whereClause,
            select: {
                province_id: true,
                province_code: true,
                province_name_th: true,
                province_name_en: true,
            },
            orderBy: { province_name_th: "asc" },
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
