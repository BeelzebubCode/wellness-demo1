//src\services\borrowRequests\handlers\listMyBorrowRequests.ts

import prisma from "@/lib/prisma";

export async function listMyBorrowRequests(input: {
  accountId: number;
  universityId: number;
  status?: string;
  q?: string;
}) {
  const where: any = {
    from_university_id: input.universityId,
    requested_by_account_id: input.accountId,
  };

  if (input.status && input.status !== "ALL") where.borrow_request_status = input.status;

  const q = (input.q || "").trim();
  if (q) {
    where.OR = [
      { borrow_request_title: { contains: q, mode: "insensitive" } },
      { borrow_request_reason: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.borrowRequest.findMany({
    where,
    orderBy: { borrow_request_created_at: "desc" },
    include: {
      assignments: {
        orderBy: { borrow_assigned_at: "desc" },
        include: {
          consultant: { include: { profile: true } },
          consultantUniversity: true,
        },
      },
      fromUniversity: true,
    },
  });
}
