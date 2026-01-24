import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";

const ALLOWED = ["CONSULTANT", "HEAD_CONSULTANT"] as const;

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bookingId = Number(params.id);
        if (Number.isNaN(bookingId)) {
            return NextResponse.json(
                { success: false, error: "Invalid booking id" },
                { status: 400 }
            );
        }

        const { account, activeUniversityId } = await requireTenant(req);
        assertRole(account.role, ALLOWED);

        const body = (await req.json().catch(() => ({}))) as { status?: string };
        const uiNext = String(body.status || "").toUpperCase();

        if (!["IN_PROGRESS", "COMPLETED"].includes(uiNext)) {
            return NextResponse.json(
                { success: false, error: "Status must be IN_PROGRESS or COMPLETED" },
                { status: 400 }
            );
        }

        const myConsultantId = (account as any)?.consultantId;
        if (!myConsultantId) {
            return NextResponse.json(
                { success: false, error: "Consultant profile not found" },
                { status: 400 }
            );
        }

        const booking = await prisma.booking.findFirst({
            where: {
                booking_id: bookingId,
                university_id: activeUniversityId,
                consultant_id: myConsultantId,
            },
            select: {
                booking_id: true,
                booking_status: true,
            },
        });

        if (!booking) {
            return NextResponse.json(
                { success: false, error: "Forbidden: booking not found in your scope" },
                { status: 403 }
            );
        }

        const cur = String(booking.booking_status || "").toUpperCase().trim();

        if (uiNext === "IN_PROGRESS") {
            // ✅ allow start จากหลายสถานะที่เจอบ่อยในระบบจริง
            const canStartFrom = ["PENDING_ASSIGNMENT", "PENDING", "ASSIGNED", "IN_PROGRESS"];

            if (!canStartFrom.includes(cur)) {
                return NextResponse.json(
                    { success: false, error: `Cannot start from status ${cur}` },
                    { status: 400 }
                );
            }

            // ✅ idempotent: ถ้าเป็น IN_PROGRESS อยู่แล้ว อย่าตีกลับ 400
            if (cur === "IN_PROGRESS") {
                return NextResponse.json({ success: true, booking });
            }

            const updated = await prisma.booking.update({
                where: { booking_id: bookingId },
                data: { booking_status: "IN_PROGRESS" as any },
                select: { booking_id: true, booking_status: true },
            });

            return NextResponse.json({ success: true, booking: updated });
        }

        // ✅ COMPLETE -> ต้องมาจาก IN_PROGRESS เท่านั้น (หรือถ้าอยาก allow ASSIGNED ก็เพิ่มได้)
        if (uiNext === "COMPLETED") {
            if (!["IN_PROGRESS"].includes(cur)) {
                return NextResponse.json(
                    { success: false, error: `Cannot complete from status ${cur}` },
                    { status: 400 }
                );
            }

            const updated = await prisma.booking.update({
                where: { booking_id: bookingId },
                data: { booking_status: "COMPLETED" as any },
                select: { booking_id: true, booking_status: true },
            });

            return NextResponse.json({ success: true, booking: updated });
        }

        return NextResponse.json(
            { success: false, error: "Unhandled" },
            { status: 400 }
        );
    } catch (e: any) {
        console.error("[BOOKING_STATUS_PATCH]", e);
        return NextResponse.json(
            { success: false, error: e?.message ?? "Failed to update status" },
            { status: e?.status ?? 500 }
        );
    }
}
