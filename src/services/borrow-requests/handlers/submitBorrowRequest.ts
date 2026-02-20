// src/services/borrowRequests/handlers/submitBorrowRequest.ts
import prisma from "@/lib/prisma";

export async function submitBorrowRequest(params: {
  borrowRequestId: number;
  activeUniversityId: number;
  accountId: number;
}) {
  const req = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: params.borrowRequestId },
  });
  if (!req) throw new Error("BorrowRequest not found");

  if (req.from_university_id !== params.activeUniversityId) {
    throw new Error("Forbidden (tenant mismatch)");
  }
  if (req.requested_by_account_id !== params.accountId) {
    throw new Error("Forbidden (not owner)");
  }
  if (req.borrow_request_status !== "DRAFT") {
    throw new Error("Only DRAFT can be submitted");
  }

  return prisma.borrowRequest.update({
    where: { borrow_request_id: params.borrowRequestId },
    data: {
      borrow_request_status: "SUBMITTED",
      borrow_submitted_at: new Date(),
      borrow_submitted_by_account_id: params.accountId,
    },
  });
}
