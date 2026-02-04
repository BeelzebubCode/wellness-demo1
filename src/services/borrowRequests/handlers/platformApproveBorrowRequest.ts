// src/services/borrowRequests/handlers/platformApproveBorrowRequest.ts

import prisma from "@/lib/prisma";

export async function platformApproveBorrowRequest(input: {
  borrowRequestId: number;
  accountId: number;
}) {
  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: input.borrowRequestId },
    select: { borrow_request_status: true },
  });
  if (!br) throw new Error("NOT_FOUND");
  if (br.borrow_request_status !== "SUBMITTED") throw new Error("ONLY_SUBMITTED_CAN_APPROVE");

  return prisma.borrowRequest.update({
    where: { borrow_request_id: input.borrowRequestId },
    data: {
      borrow_request_status: "APPROVED",
      borrow_approved_at: new Date(),
      borrow_approved_by_account_id: input.accountId,

      // เคลียร์ reject เดิม (กันข้อมูลค้าง)
      borrow_rejected_at: null,
      borrow_rejected_by_account_id: null,
      borrow_reject_reason: null,
    },
  });
}
