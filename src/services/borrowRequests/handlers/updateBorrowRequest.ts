// src/services/borrowRequests/handlers/updateBorrowRequest.ts

import prisma from "@/lib/prisma";

export async function updateBorrowRequest(params: {
  borrowRequestId: number;
  accountId: number;
  fromUniversityId: number;
  patch: {
    title?: string;
    reason?: string;
    detailJson?: any;
    neededFrom?: Date | null;
    neededTo?: Date | null;
    neededCount?: number;
  };
}) {
  const { borrowRequestId, accountId, fromUniversityId, patch } = params;

  const existing = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: borrowRequestId },
  });

  if (!existing) throw new Error("BorrowRequest not found");
  if (existing.from_university_id !== fromUniversityId) throw new Error("Forbidden (tenant mismatch)");
  if (existing.requested_by_account_id !== accountId) throw new Error("Forbidden (not owner)");
  if (existing.borrow_request_status !== "DRAFT") throw new Error("Only DRAFT can be edited");

  return prisma.borrowRequest.update({
    where: { borrow_request_id: borrowRequestId },
    data: {
      borrow_request_title: patch.title ?? undefined,
      borrow_request_reason: patch.reason ?? undefined,
      borrow_request_detail: patch.detailJson ? JSON.stringify(patch.detailJson) : undefined,
      borrow_needed_from: patch.neededFrom ?? undefined,
      borrow_needed_to: patch.neededTo ?? undefined,
      borrow_needed_count: patch.neededCount ?? undefined,
    },
  });
}
