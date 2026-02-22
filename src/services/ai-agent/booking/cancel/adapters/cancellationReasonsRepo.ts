// src/services/ai-agent/booking/cancel/adapters/cancellationReasonsRepo.ts
import prisma from "@/lib/prisma";

export type CancelReasonItem = {
    id: number;
    code: string;
    name: string;
};

let _cache: CancelReasonItem[] | null = null;

export async function loadCancellationReasons(): Promise<CancelReasonItem[]> {
    if (_cache) return _cache;

    const rows = await prisma.cancellationReason.findMany({
        select: {
            cancellation_reason_id: true,
            cancellation_reason_code: true,
            cancellation_reason_name_en: true,
            cancellation_reason_name_th: true,
        },
        orderBy: { cancellation_reason_id: "asc" },
    });

    _cache = rows.map((r) => ({
        id: r.cancellation_reason_id,
        code: r.cancellation_reason_code,
        name: r.cancellation_reason_name_en ?? r.cancellation_reason_name_th,
    }));

    return _cache;
}
