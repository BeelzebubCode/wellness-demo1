export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const pending = await prisma.booking.findMany({
        take: 10,
        orderBy: { booking_id: 'desc' },
        select: {
            booking_id: true,
            booking_status: true,
            booking_created_at: true,
            assignments: {
                select: {
                    is_auto_assigned: true,
                    consultant_id: true,
                    borrow_assignment_id: true,
                    assigned_note: true,
                }
            },
            timeSlot: {
                select: {
                    time_slot_start_datetime: true,
                }
            }
        }
    });

    return NextResponse.json({
        pending
    });
}
