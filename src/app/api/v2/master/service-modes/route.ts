// GET /api/v2/master/service-modes
// Returns all service mode categories from DB — dynamic, no hardcoding
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const modes = await prisma.serviceModeCategory.findMany({
            select: {
                service_mode_id: true,
                code: true,
                name_th: true,
                name_en: true,
                sort_order: true,
            },
            orderBy: { sort_order: "asc" },
        });

        return NextResponse.json({ success: true, data: modes });
    } catch (error) {
        console.error("[ERROR] GET /api/v2/master/service-modes:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch service modes" },
            { status: 500 }
        );
    }
}
