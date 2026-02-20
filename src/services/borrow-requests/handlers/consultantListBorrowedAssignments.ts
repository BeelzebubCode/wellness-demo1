// src/services/borrowRequests/handlers/consultantListBorrowedAssignments.ts

import prisma from "@/lib/prisma";

export async function consultantListBorrowedAssignments(input: {
    accountId: number;
}) {
    // 1. Get consultant from account
    const consultant = await prisma.consultant.findUnique({
        where: { account_id: input.accountId },
        select: {
            consultant_id: true,
            university_id: true
        },
    });

    if (!consultant) {
        throw new Error("CONSULTANT_NOT_FOUND");
    }

    // 2. Query BorrowAssignment where consultant_id matches
    const assignments = await prisma.borrowAssignment.findMany({
        where: {
            consultant_id: consultant.consultant_id,
        },
        include: {
            borrowRequest: {
                include: {
                    fromUniversity: {
                        select: {
                            university_id: true,
                            university_code: true,
                            university_name_th: true,
                            university_name_en: true,
                        },
                    },
                },
            },
            BookingAssignment: {
                include: {
                    booking: {
                        select: {
                            booking_id: true,
                            booking_status: true,
                            problemCategory: {
                                select: {
                                    problem_category_name_th: true,
                                },
                            },
                            student: {
                                select: {
                                    student_code: true,
                                    profile: {
                                        select: {
                                            student_first_name_th: true,
                                            student_last_name_th: true,
                                            student_nickname_th: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { assigned_at: 'desc' },
            }
        },
        orderBy: { borrow_assigned_at: "desc" },
    });

    // 3. Transform to response format
    return assignments.map((a) => {
        // Access via property or array depending on relation type, but here it is defined as array in schema
        // However, Prisma types might be tricky if not generated perfectly.
        // Let's assume standard behavior.

        return {
            assignmentId: a.borrow_assignment_id,
            borrowRequestId: a.borrow_request_id,
            title: a.borrowRequest.borrow_request_title,
            reason: a.borrowRequest.borrow_request_reason,
            fromUniversityId: a.borrowRequest.from_university_id,
            fromUniversityCode: a.borrowRequest.fromUniversity.university_code,
            fromUniversityNameTh: a.borrowRequest.fromUniversity.university_name_th,
            fromUniversityNameEn: a.borrowRequest.fromUniversity.university_name_en,
            startAt: a.borrow_assign_start_at.toISOString(),
            endAt: a.borrow_assign_end_at.toISOString(),
            status: a.borrowRequest.borrow_request_status,
            assignedAt: a.borrow_assigned_at.toISOString(),
            submittedAt: a.borrowRequest.borrow_submitted_at?.toISOString() || null,
            createdAt: a.borrowRequest.borrow_request_created_at.toISOString(),
            note: a.borrow_assignment_note,
            assignedBookings: a.BookingAssignment.map(ba => {
                const s = ba.booking.student;
                const p = s.profile;
                const name = p
                    ? `${p.student_first_name_th} ${p.student_last_name_th} (${p.student_nickname_th || "-"})`
                    : s.student_code || "นิสิต";

                return {
                    bookingId: ba.booking_id,
                    status: ba.booking.booking_status,
                    assignedAt: ba.assigned_at.toISOString(),
                    problemCategory: ba.booking.problemCategory?.problem_category_name_th ?? "ไม่ระบุ",
                    studentName: name
                };
            })
        };
    });
}
