// GET /api/v2/master/regions
// Returns all regions + special zone provinces from DB
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const [regions, specialZoneProvinces] = await Promise.all([
            prisma.region.findMany({
                select: {
                    region_id: true,
                    region_code: true,
                    region_name_th: true,
                    region_name_en: true,
                },
                orderBy: { region_id: "asc" },
            }),
            prisma.province.findMany({
                where: { is_special_zone: true },
                select: {
                    province_id: true,
                    province_name_th: true,
                    province_name_en: true,
                    province_code: true,
                },
                orderBy: { province_name_th: "asc" },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                regions,
                specialZoneProvinces,
            },
        });
    } catch (error) {
        console.error("[ERROR] GET /api/v2/master/regions:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch regions" },
            { status: 500 }
        );
    }
}
