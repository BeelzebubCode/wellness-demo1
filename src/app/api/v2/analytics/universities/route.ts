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
        const provinceId = searchParams.get("province_id");

        const whereClause: any = { university_is_active: true };

        if (provinceId) {
            whereClause.province_id = Number(provinceId);
        } else if (regionId) {
            whereClause.province = { region_id: Number(regionId) };
        }

        const rows = await prisma.university.findMany({
            where: whereClause,
            select: {
                university_id: true,
                university_code: true,
                university_name_th: true,
                university_name_en: true,
            },
            orderBy: { university_name_th: "asc" },
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
