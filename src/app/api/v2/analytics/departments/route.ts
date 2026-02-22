// src/app/api/v2/analytics/departments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const tenant = await requireTenant(req);
        const { searchParams } = new URL(req.url);
        const facultyId = searchParams.get("faculty_id") ? Number(searchParams.get("faculty_id")) : undefined;

        const rows = await prisma.department.findMany({
            where: {
                university_id: tenant.universityId,
                ...(facultyId ? { faculty_id: facultyId } : {}),
            },
            select: {
                department_id: true,
                department_code: true,
                department_name_th: true,
                department_name_en: true,
            },
            orderBy: { department_code: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: rows.map((r) => ({
                departmentId: r.department_id,
                departmentCode: r.department_code,
                departmentNameTh: r.department_name_th,
                departmentNameEn: r.department_name_en,
            })),
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || "Internal Server Error" },
            { status: error?.status || 500 },
        );
    }
}
