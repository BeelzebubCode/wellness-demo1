// src/app/api/v2/analytics/chronic-conditions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const conditions = await prisma.chronicConditionCategory.findMany({
            where: { is_active: true },
            orderBy: { sort_order: "asc" },
            select: {
                condition_category_id: true,
                condition_code: true,
                condition_name_th: true,
                condition_name_en: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: conditions.map((c) => ({
                id: c.condition_category_id,
                code: c.condition_code,
                nameTh: c.condition_name_th,
                nameEn: c.condition_name_en,
            })),
        });
    } catch (error) {
        console.error("[CHRONIC_CONDITIONS_API_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch chronic conditions" },
            { status: 500 }
        );
    }
}
