import prisma from "@/lib/prisma";

export async function platformRejectBorrowRequest(input: {
  borrowRequestId: number;
  accountId: number;
  reason: string;
}) {
  const reason = String(input.reason || "").trim();
  if (!reason) throw new Error("REASON_REQUIRED");

  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: input.borrowRequestId },
    select: { borrow_request_status: true },
  });
  if (!br) throw new Error("NOT_FOUND");
  if (br.borrow_request_status !== "SUBMITTED") throw new Error("ONLY_SUBMITTED_CAN_REJECT");

  return prisma.borrowRequest.update({
    where: { borrow_request_id: input.borrowRequestId },
    data: {
      borrow_request_status: "REJECTED",
      borrow_rejected_at: new Date(),
      borrow_rejected_by_account_id: input.accountId,
      borrow_reject_reason: reason,

      // เคลียร์ approve เดิม (กันข้อมูลค้าง)
      borrow_approved_at: null,
      borrow_approved_by_account_id: null,
    },
  });
}
