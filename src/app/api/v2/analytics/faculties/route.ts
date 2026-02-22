// src/app/api/v2/analytics/faculties/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant(req);

        const rows = await prisma.faculty.findMany({
            where: { university_id: tenant.universityId },
            select: {
                faculty_id: true,
                faculty_code: true,
                faculty_name_th: true,
                faculty_name_en: true,
            },
            orderBy: { faculty_code: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: rows.map((r) => ({
                facultyId: r.faculty_id,
                facultyCode: r.faculty_code,
                facultyNameTh: r.faculty_name_th,
                facultyNameEn: r.faculty_name_en,
            })),
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || "Internal Server Error" },
            { status: error?.status || 500 },
        );
    }
}
