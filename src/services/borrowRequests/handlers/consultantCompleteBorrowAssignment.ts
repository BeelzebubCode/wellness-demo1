// src/services/borrowRequests/handlers/consultantCompleteBorrowAssignment.ts

import prisma from "@/lib/prisma";

/**
 * Consultant ยืนยันงาน → เปลี่ยน BorrowRequest status เป็น COMPLETED
 * ต้องเป็น consultant ที่ถูก assign จริงเท่านั้น
 */
export async function consultantCompleteBorrowAssignment(input: {
    accountId: number;
    borrowAssignmentId: number;
}) {
    // 1. Get consultant from account
    const consultant = await prisma.consultant.findUnique({
        where: { account_id: input.accountId },
        select: { consultant_id: true },
    });

    if (!consultant) {
        throw new Error("CONSULTANT_NOT_FOUND");
    }

    // 2. Find the assignment and verify ownership
    const assignment = await prisma.borrowAssignment.findUnique({
        where: { borrow_assignment_id: input.borrowAssignmentId },
        include: {
            borrowRequest: {
                select: {
                    borrow_request_id: true,
                    borrow_request_status: true,
                },
            },
        },
    });

    if (!assignment) {
        throw new Error("ASSIGNMENT_NOT_FOUND");
    }

    // 3. Verify this consultant owns the assignment
    if (assignment.consultant_id !== consultant.consultant_id) {
        throw new Error("FORBIDDEN");
    }

    // 4. Only ASSIGNED requests can be completed
    if (assignment.borrowRequest.borrow_request_status !== "ASSIGNED") {
        throw new Error("ONLY_ASSIGNED_CAN_COMPLETE");
    }

    // 5. Update borrow request status to COMPLETED
    const updated = await prisma.$transaction(async (tx) => {
        const req = await tx.borrowRequest.update({
            where: { borrow_request_id: assignment.borrow_request_id },
            data: {
                borrow_request_status: "COMPLETED",
            },
            select: {
                borrow_request_id: true,
                borrow_request_status: true,
                from_university_id: true,
            },
        });

        // 6. Check if there are other active assignments for this university
        // If not, revoke access
        const targetUniId = req.from_university_id;

        const otherActive = await tx.borrowAssignment.count({
            where: {
                consultant_id: consultant.consultant_id,
                borrowRequest: {
                    from_university_id: targetUniId,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
                },
                borrow_assignment_id: { not: assignment.borrow_assignment_id },
            },
        });

        if (otherActive === 0) {
            // Revoke access
            await tx.accountUniversityPermission.updateMany({
                where: {
                    account_id: input.accountId,
                    university_id: targetUniId,
                    access_revoked_at: null,
                },
                data: {
                    access_revoked_at: new Date(),
                },
            });
        }

        return req;
    });

    return {
        borrowRequestId: updated.borrow_request_id,
        status: updated.borrow_request_status,
    };
}
