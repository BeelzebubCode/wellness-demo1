import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const pending = await prisma.booking.findMany({
        take: 5,
        orderBy: { booking_id: 'desc' },
        select: {
            booking_id: true,
            booking_status: true,
            booking_created_at: true,
            timeSlot: {
                select: {
                    time_slot_start_datetime: true,
                }
            }
        }
    });

    const now = new Date();
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    return NextResponse.json({
        now: now.toISOString(),
        fiveMinsAgo: fiveMinsAgo.toISOString(),
        pending
    });
}
