import prisma from "@/lib/prisma";

export async function getBorrowRequest(input: {
  borrowRequestId: number;
  viewer:
    | { mode: "HEAD"; accountId: number; universityId: number }
    | { mode: "PLATFORM"; accountId: number };
}) {
  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: input.borrowRequestId },
    include: {
      fromUniversity: true,
      requestedBy: { select: { account_id: true, account_username: true, account_role: true } },
      submittedBy: { select: { account_id: true, account_username: true } },
      approvedBy: { select: { account_id: true, account_username: true } },
      rejectedBy: { select: { account_id: true, account_username: true } },
      assignments: {
        orderBy: { borrow_assigned_at: "desc" },
        include: {
          consultant: { include: { profile: true, university: true } },
          consultantUniversity: true,
          assignedBy: { select: { account_id: true, account_username: true } },
        },
      },
    },
  });

  if (!br) throw new Error("NOT_FOUND");

  if (input.viewer.mode === "HEAD") {
    if (br.from_university_id !== input.viewer.universityId) throw new Error("FORBIDDEN_TENANT");
    if (br.requested_by_account_id !== input.viewer.accountId) throw new Error("FORBIDDEN_OWNER");
  }

  return br;
}
