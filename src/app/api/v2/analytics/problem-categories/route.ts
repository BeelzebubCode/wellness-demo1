// src/app/api/v2/analytics/problem-categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        await requireTenant(req); // auth check only

        const rows = await prisma.problemCategory.findMany({
            select: {
                problem_category_id: true,
                problem_category_code: true,
                problem_category_name_th: true,
                problem_category_name_en: true,
            },
            orderBy: { problem_category_code: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: rows.map((r) => ({
                problemCategoryId: r.problem_category_id,
                problemCategoryCode: r.problem_category_code,
                problemCategoryNameTh: r.problem_category_name_th,
                problemCategoryNameEn: r.problem_category_name_en,
            })),
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || "Internal Server Error" },
            { status: error?.status || 500 },
        );
    }
}
