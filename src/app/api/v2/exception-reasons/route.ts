// src/app/api/v2/exception-reasons/route.ts
// Public GET: list all active exception reasons (sorted by sort_order)
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
    try {
        const reasons = await prisma.exceptionReason.findMany({
            where: { exception_reason_is_active: true },
            orderBy: { exception_reason_sort_order: "asc" },
            select: {
                exception_reason_id: true,
                exception_reason_code: true,
                exception_reason_name_th: true,
                exception_reason_name_en: true,
            },
        });

        return NextResponse.json({ success: true, data: reasons });
    } catch (e: any) {
        console.error("[GET /api/v2/exception-reasons]", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
