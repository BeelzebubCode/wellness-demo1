import prisma from "@/lib/prisma";

export async function submitBorrowRequest(input: {
  borrowRequestId: number;
  accountId: number;
  universityId: number;
  note?: string;
}) {
  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: input.borrowRequestId },
    select: {
      borrow_request_id: true,
      from_university_id: true,
      requested_by_account_id: true,
      borrow_request_status: true,
    },
  });

  if (!br) throw new Error("NOT_FOUND");
  if (br.from_university_id !== input.universityId) throw new Error("FORBIDDEN_TENANT");
  if (br.requested_by_account_id !== input.accountId) throw new Error("FORBIDDEN_OWNER");
  if (br.borrow_request_status !== "DRAFT") throw new Error("ONLY_DRAFT_CAN_SUBMIT");

  return prisma.borrowRequest.update({
    where: { borrow_request_id: input.borrowRequestId },
    data: {
      borrow_request_status: "SUBMITTED",
      borrow_submitted_at: new Date(),
      borrow_submitted_by_account_id: input.accountId,
      borrow_submit_note: input.note ? String(input.note).trim() : null,
    },
  });
}
