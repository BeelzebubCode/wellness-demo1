// src/services/borrowRequests/handlers/platformRejectBorrowRequest.ts
import prisma from "@/lib/prisma";
import { parseRejectBorrowRequestBody } from "../validators";

export async function platformRejectBorrowRequest(params: {
  borrowRequestId: number;
  rejectedByAccountId: number;
  body: unknown; // { reason: string }
}) {
  const { reason } = parseRejectBorrowRequestBody(params.body);

  return prisma.$transaction(async (tx) => {
    const br = await tx.borrowRequest.findUnique({
      where: { borrow_request_id: params.borrowRequestId },
      select: {
        borrow_request_id: true,
        borrow_request_status: true,
      },
    });

    if (!br) throw new Error("NOT_FOUND");

    // ✅ ปกติ reject ได้ตอน SUBMITTED/APPROVED (แล้วแต่ rule ของคุณ)
    if (!["SUBMITTED", "APPROVED"].includes(br.borrow_request_status as any)) {
      throw new Error("NOT_REJECTABLE");
    }

    const updated = await tx.borrowRequest.update({
      where: { borrow_request_id: params.borrowRequestId },
      data: {
        borrow_request_status: "REJECTED",
        borrow_rejected_at: new Date(),
        borrow_rejected_by_account_id: params.rejectedByAccountId,
        borrow_reject_reason: reason,
      },
    });

    return updated;
  });
}
