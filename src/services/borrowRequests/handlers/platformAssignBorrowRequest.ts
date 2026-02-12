// src/services/borrowRequests/handlers/platformAssignBorrowRequest.ts

import prisma from "@/lib/prisma";
import { parseAssignBorrowRequestBody } from "../validators";

// ใช้ logic เดิมของคุณ แต่ทำเป็น function ย่อยสำหรับ assign ทีละ item
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assignOne(tx: any, input: {
  borrowRequestId: number;
  assignedByAccountId: number;
  consultantId: number;
  consultantUniversityId: number;
  startAt: string | Date;
  endAt: string | Date;
  note?: string | null;
}) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (isNaN(startAt.getTime())) throw new Error("INVALID_START");
  if (isNaN(endAt.getTime())) throw new Error("INVALID_END");
  if (endAt <= startAt) throw new Error("END_MUST_AFTER_START");

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

  const consultant = await tx.consultant.findUnique({
    where: { consultant_id: input.consultantId },
    select: { consultant_id: true, account_id: true },
  });
  if (!consultant) throw new Error("CONSULTANT_NOT_FOUND");

  // ✅ ป้องกัน assign consultant ที่มี assignment อยู่แล้ว (ข้าม request ด้วย)
  const existingAssignment = await tx.borrowAssignment.findFirst({
    where: {
      consultant_id: input.consultantId,
      borrowRequest: {
        borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
      },
      // ช่วงเวลาซ้อนกัน (overlap)
      borrow_assign_start_at: { lt: endAt },
      borrow_assign_end_at: { gt: startAt },
    },
  });
  if (existingAssignment) throw new Error("CONSULTANT_ALREADY_ASSIGNED");

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

  return { assignment, br };
}

export async function platformAssignBorrowRequest(params: {
  borrowRequestId: number;
  assignedByAccountId: number;
  body: unknown; // ✅ FE ส่ง { items: [...] }
}) {
  const { items } = parseAssignBorrowRequestBody(params.body);

  return prisma.$transaction(async (tx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdAssignments: any[] = [];

    // ทำทีละคนตาม items
    for (const it of items) {
      const { assignment } = await assignOne(tx, {
        borrowRequestId: params.borrowRequestId,
        assignedByAccountId: params.assignedByAccountId,
        consultantId: it.consultantId,
        consultantUniversityId: it.consultantUniversityId,
        startAt: it.startAt,
        endAt: it.endAt,
        note: it.note ?? null,
      });
      createdAssignments.push(assignment);
    }

    // นับหลังสร้างทั้งหมด
    const br = await tx.borrowRequest.findUnique({
      where: { borrow_request_id: params.borrowRequestId },
      select: { borrow_needed_count: true },
    });

    const assignedCount = await tx.borrowAssignment.count({
      where: { borrow_request_id: params.borrowRequestId },
    });

    const needed = br?.borrow_needed_count ?? 1;
    const nextStatus = assignedCount >= needed ? "ASSIGNED" : "APPROVED";

    await tx.borrowRequest.update({
      where: { borrow_request_id: params.borrowRequestId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { borrow_request_status: nextStatus as any },
    });

    // ✅ คืน detail ให้ FE ใช้ต่อ (assignments ต้องมี)
    const detail = await tx.borrowRequest.findUnique({
      where: { borrow_request_id: params.borrowRequestId },
      include: {
        assignments: true,
        fromUniversity: true,
        requestedBy: true,
      },
    });

    return {
      assignmentsCreated: createdAssignments.length,
      assignedCount,
      neededCount: needed,
      request: detail,
    };
  });
}
