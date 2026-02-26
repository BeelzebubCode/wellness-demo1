// scripts/seed-penalty-bookings.ts
// Seeds 3 cancelled bookings (late cancel 6-24h) for NU 0001 student
import prisma from "../src/lib/prisma";

async function main() {
    const universityId = 140;
    const studentId = 1353660;

    const reason = await prisma.cancellationReason.findFirst({
        select: { cancellation_reason_id: true },
    });
    if (!reason) throw new Error("No cancellation reason found");

    const problem = await prisma.problemCategory.findFirst({
        select: { problem_category_id: true },
    });
    if (!problem) throw new Error("No problem category found");

    const now = new Date();
    const slots = await prisma.timeSlot.findMany({
        where: {
            university_id: universityId,
            time_slot_start_datetime: {
                gte: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                lt: now,
            },
        },
        select: { time_slot_id: true, time_slot_start_datetime: true },
        orderBy: { time_slot_start_datetime: "desc" },
        take: 10,
    });

    if (slots.length < 3) throw new Error(`Only ${slots.length} past slots found, need at least 3`);

    const picked = [slots[0], slots[Math.min(3, slots.length - 1)], slots[Math.min(6, slots.length - 1)]];
    console.log("Creating 3 late-cancel bookings...");

    for (let i = 0; i < 3; i++) {
        const slot = picked[i];
        const hoursBeforeSlot = 8 + i * 3; // 8h, 11h, 14h — all 6-24h range
        const cancelledAt = new Date(slot.time_slot_start_datetime.getTime() - hoursBeforeSlot * 60 * 60 * 1000);
        const createdAt = new Date(cancelledAt.getTime() - 24 * 60 * 60 * 1000);

        const booking = await prisma.booking.create({
            data: {
                university_id: universityId,
                student_id: studentId,
                time_slot_id: slot.time_slot_id,
                problem_category_id: problem.problem_category_id,
                booking_status: "CANCELLED",
                booking_service_mode: "ONSITE",
                booking_created_at: createdAt,
            },
        });

        await (prisma as any).bookingCancellation.create({
            data: {
                university_id: universityId,
                booking_id: booking.booking_id,
                cancellation_reason_id: reason.cancellation_reason_id,
                booking_cancellation_note: `ยกเลิกกะทันหัน ${hoursBeforeSlot} ชม. ก่อนนัด (seed data)`,
                booking_cancellation_cancelled_at: cancelledAt,
                booking_cancellation_cancelled_by_id: 1371806,
            },
        });

        const diffHrs = (slot.time_slot_start_datetime.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);
        console.log(`  #${i + 1} Booking ${booking.booking_id}: slot=${slot.time_slot_start_datetime.toISOString()}, diff=${diffHrs.toFixed(1)}h`);
    }

    console.log("\nDone! 3 late-cancel bookings created for student", studentId);
    await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
