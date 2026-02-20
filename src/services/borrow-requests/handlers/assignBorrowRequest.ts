// src/services/borrowRequests/handlers/assignBorrowRequest.ts

import prisma from "@/lib/prisma";

export async function assignBorrowRequest(params: {
  borrowRequestId: number;
  assignedByAccountId: number;
  consultantId: number;
  consultantUniversityId: number;

  assignStartAt: Date;
  assignEndAt: Date;
  note?: string;
}) {
  const {
    borrowRequestId,
    assignedByAccountId,
    consultantId,
    consultantUniversityId,

    assignStartAt,
    assignEndAt,
    note,
  } = params;

  const req = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: borrowRequestId },
    include: { assignments: true },
  });
  if (!req) throw new Error("BorrowRequest not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!["SUBMITTED", "APPROVED", "ASSIGNED"].includes(req.borrow_request_status as any)) {
    throw new Error("Request not assignable in current status");
  }

  // 1. Check for overlapping ACTIVE shifts
  const overlap = await prisma.consultantBorrowAvailability.findFirst({
    where: {
      consultant_id: consultantId,
      status: "ACTIVE",
      availability_start_date: { lt: assignEndAt },
      availability_end_date: { gt: assignStartAt },
    },
  });

  if (overlap) {
    throw new Error("Consultant is already borrowed during this period");
  }

  // 2. Create Assignment
  const assignment = await prisma.borrowAssignment.create({
    data: {
      borrow_request_id: borrowRequestId,
      consultant_id: consultantId,
      consultant_university_id: consultantUniversityId,
      borrow_assign_start_at: assignStartAt,
      borrow_assign_end_at: assignEndAt,
      borrow_assigned_by_account_id: assignedByAccountId,
      borrow_assignment_note: note ?? null,
    },
  });

  // 3. Create ConsultantBorrowAvailability (The actual borrow block)
  try {
     await prisma.consultantBorrowAvailability.create({
      data: {
        consultant_id: consultantId,
        home_university_id: consultantUniversityId,
        target_university_id: req.from_university_id, // The borrower
        borrow_assignment_id: assignment.borrow_assignment_id,
        availability_start_date: assignStartAt,
        availability_end_date: assignEndAt,
        status: "ACTIVE",
        created_by_account_id: assignedByAccountId,
      }
    });
  } catch (err) {
    // If borrow shift creation fails (e.g. trigger limit), rollback assignment?
    // In a real app we should use $transaction.
    // For now, let's wrap in transaction if possible, or just throw.
    // Since we didn't use transaction above, we might leave partial state.
    // Let's rewrite to use transaction in next step if needed, or assume basic flow for now.
    // Re-throwing so caller sees error.
    await prisma.borrowAssignment.delete({ where: { borrow_assignment_id: assignment.borrow_assignment_id } });
    throw err;
  }

  // update request status: ถ้า assign ครบตาม needed_count ค่อย ASSIGNED
  const totalAssigned = req.assignments.length + 1;
  const needed = req.borrow_needed_count ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextStatus = totalAssigned >= needed ? "ASSIGNED" : (req.borrow_request_status as any);

  const updatedReq = await prisma.borrowRequest.update({
    where: { borrow_request_id: borrowRequestId },
    data: { borrow_request_status: nextStatus },
  });

  return { assignment, request: updatedReq, totalAssigned, needed };
}
