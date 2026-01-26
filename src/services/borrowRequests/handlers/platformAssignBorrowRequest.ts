import prisma from "@/lib/prisma";

export async function platformAssignBorrowRequest(input: {
  borrowRequestId: number;
  assignedByAccountId: number;

  consultantId: number;
  consultantUniversityId: number;

  startAt: string | Date;
  endAt: string | Date;

  note?: string;
}) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (!(startAt instanceof Date) || isNaN(startAt.getTime())) throw new Error("INVALID_START");
  if (!(endAt instanceof Date) || isNaN(endAt.getTime())) throw new Error("INVALID_END");
  if (endAt <= startAt) throw new Error("END_MUST_AFTER_START");

  return prisma.$transaction(async (tx) => {
    const br = await tx.borrowRequest.findUnique({
      where: { borrow_request_id: input.borrowRequestId },
      select: {
        borrow_request_id: true,
        borrow_request_status: true,
        from_university_id: true,
        borrow_needed_count: true,
      },
    });
    if (!br) throw new Error("NOT_FOUND");
    if (br.borrow_request_status !== "APPROVED") throw new Error("ONLY_APPROVED_CAN_ASSIGN");

    // เช็ค consultant + หา account_id เพื่อ grant access
    const consultant = await tx.consultant.findUnique({
      where: { consultant_id: input.consultantId },
      select: { consultant_id: true, account_id: true },
    });
    if (!consultant) throw new Error("CONSULTANT_NOT_FOUND");

    // สร้าง assignment (กันซ้ำด้วย @@unique([borrow_request_id, consultant_id]) ที่ schema)
    const assignment = await tx.borrowAssignment.create({
      data: {
        borrow_request_id: input.borrowRequestId,
        consultant_id: input.consultantId,
        consultant_university_id: input.consultantUniversityId,

        borrow_assign_start_at: startAt,
        borrow_assign_end_at: endAt,

        borrow_assigned_by_account_id: input.assignedByAccountId,
        borrow_assignment_note: input.note ? String(input.note).trim() : null,
      },
    });

    // grant สิทธิ์เข้า tenant "มหาลัยผู้ขอ" ให้ consultant (ชั่วคราว)
    await tx.accountUniversityAccess.upsert({
      where: {
        account_id_university_id: {
          account_id: consultant.account_id,
          university_id: br.from_university_id,
        },
      },
      create: {
        account_id: consultant.account_id,
        university_id: br.from_university_id,
        access_role: "CONSULTANT",
        access_granted_by_account_id: input.assignedByAccountId,
        access_granted_at: new Date(),
        access_revoked_at: null,
      },
      update: {
        access_role: "CONSULTANT",
        access_granted_by_account_id: input.assignedByAccountId,
        access_revoked_at: null,
      },
    });

    // อัปเดตสถานะ request → ASSIGNED เมื่อมี assignment แล้ว (และยังไม่เกิน needed_count)
    const assignedCount = await tx.borrowAssignment.count({
      where: { borrow_request_id: input.borrowRequestId },
    });

    const nextStatus =
      assignedCount >= br.borrow_needed_count ? "ASSIGNED" : "APPROVED";

    const updatedRequest = await tx.borrowRequest.update({
      where: { borrow_request_id: input.borrowRequestId },
      data: { borrow_request_status: nextStatus as any },
    });

    return { assignment, updatedRequest, assignedCount };
  });
}
