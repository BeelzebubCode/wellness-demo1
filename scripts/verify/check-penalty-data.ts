import prisma from "../src/lib/prisma";

async function main() {
    const uni = await prisma.university.findFirst({ where: { university_code: "NU" }, select: { university_id: true } });
    console.log("University:", JSON.stringify(uni));

    const stu = await prisma.student.findFirst({
        where: { university_id: uni!.university_id },
        select: { student_id: true, account_id: true, student_code: true },
        orderBy: { student_id: "asc" },
    });
    console.log("Student:", JSON.stringify(stu));

    const trust = await prisma.studentTrustStatus.findUnique({
        where: { university_id_student_id: { university_id: uni!.university_id, student_id: stu!.student_id } },
    });
    console.log("Trust:", JSON.stringify(trust));

    const cancelled = await prisma.booking.count({
        where: { university_id: uni!.university_id, student_id: stu!.student_id, booking_status: "CANCELLED" },
    });
    console.log("Cancelled bookings count:", cancelled);

    const recent = await prisma.booking.findMany({
        where: { university_id: uni!.university_id, student_id: stu!.student_id, booking_status: "CANCELLED" },
        select: {
            booking_id: true,
            booking_created_at: true,
            time_slot_id: true,
            cancellation: {
                select: { booking_cancellation_cancelled_at: true },
            },
            timeSlot: {
                select: { time_slot_start_datetime: true },
            },
        },
        orderBy: { booking_created_at: "desc" },
        take: 5,
    });
    console.log("Recent cancelled:", JSON.stringify(recent, null, 2));

    // All bookings summary
    const all = await prisma.booking.groupBy({
        by: ["booking_status"],
        where: { university_id: uni!.university_id, student_id: stu!.student_id },
        _count: true,
    });
    console.log("All bookings by status:", JSON.stringify(all));

    await prisma.$disconnect();
}

main().catch(console.error);
