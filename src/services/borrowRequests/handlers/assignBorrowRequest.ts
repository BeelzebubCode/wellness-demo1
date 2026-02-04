// src/services/borrowRequests/handlers/assignBorrowRequest.ts

import prisma from "@/lib/prisma";

export async function assignBorrowRequest(params: {
  borrowRequestId: number;
  assignedByAccountId: number;
  consultantId: number;
  consultantUniversityId: number;
  onCallShiftId?: number;
  assignStartAt: Date;
  assignEndAt: Date;
  note?: string;
}) {
  const {
    borrowRequestId,
    assignedByAccountId,
    consultantId,
    consultantUniversityId,
    onCallShiftId,
    assignStartAt,
    assignEndAt,
    note,
  } = params;

  const req = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: borrowRequestId },
    include: { assignments: true },
  });
  if (!req) throw new Error("BorrowRequest not found");
  if (!["SUBMITTED", "APPROVED", "ASSIGNED"].includes(req.borrow_request_status as any)) {
    throw new Error("Request not assignable in current status");
  }

  // guard: if onCallShiftId provided, ensure shift belongs to that consultant + time overlaps
  if (onCallShiftId) {
    const shift = await prisma.borrowOnCallShift.findUnique({
      where: { borrow_on_call_shift_id: onCallShiftId },
    });
    if (!shift) throw new Error("OnCallShift not found");
    if (shift.consultant_id !== consultantId) throw new Error("Shift consultant mismatch");
    if (shift.consultant_university_id !== consultantUniversityId) throw new Error("Shift university mismatch");

    // ensure assigned time fits within shift window
    if (!(assignStartAt >= shift.on_call_start_at && assignEndAt <= shift.on_call_end_at)) {
      throw new Error("Assigned range must be within on-call shift range");
    }
  }

  // create assignment (unique borrow_request_id + consultant_id already enforced by schema)
  const assignment = await prisma.borrowAssignment.create({
    data: {
      borrow_request_id: borrowRequestId,
      consultant_id: consultantId,
      consultant_university_id: consultantUniversityId,
      borrow_on_call_shift_id: onCallShiftId ?? null,
      borrow_assign_start_at: assignStartAt,
      borrow_assign_end_at: assignEndAt,
      borrow_assigned_by_account_id: assignedByAccountId,
      borrow_assignment_note: note ?? null,
    },
  });

  // update request status: ถ้า assign ครบตาม needed_count ค่อย ASSIGNED
  const totalAssigned = req.assignments.length + 1;
  const needed = req.borrow_needed_count ?? 1;

  const nextStatus = totalAssigned >= needed ? "ASSIGNED" : (req.borrow_request_status as any);

  const updatedReq = await prisma.borrowRequest.update({
    where: { borrow_request_id: borrowRequestId },
    data: { borrow_request_status: nextStatus },
  });

  return { assignment, request: updatedReq, totalAssigned, needed };
}
