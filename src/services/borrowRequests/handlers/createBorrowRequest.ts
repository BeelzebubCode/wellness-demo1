import prisma from "@/lib/prisma";

export async function createBorrowRequest(input: {
  universityId: number;
  requestedByAccountId: number;

  borrow_request_title: string;
  borrow_request_reason: string;
  borrow_request_detail?: string | null;

  borrow_needed_from?: string | Date | null;
  borrow_needed_to?: string | Date | null;
  borrow_needed_count?: number | null;
}) {
  const title = String(input.borrow_request_title || "").trim();
  const reason = String(input.borrow_request_reason || "").trim();
  if (!title) throw new Error("TITLE_REQUIRED");
  if (!reason) throw new Error("REASON_REQUIRED");

  const neededCount =
    input.borrow_needed_count == null ? 1 : Number(input.borrow_needed_count);
  if (!Number.isFinite(neededCount) || neededCount <= 0)
    throw new Error("INVALID_NEEDED_COUNT");

  const neededFrom = input.borrow_needed_from ? new Date(input.borrow_needed_from) : null;
  const neededTo = input.borrow_needed_to ? new Date(input.borrow_needed_to) : null;

  return prisma.borrowRequest.create({
    data: {
      from_university_id: input.universityId,
      requested_by_account_id: input.requestedByAccountId,

      borrow_request_title: title,
      borrow_request_reason: reason,
      borrow_request_detail: input.borrow_request_detail ?? null,

      borrow_needed_from: neededFrom,
      borrow_needed_to: neededTo,

      borrow_needed_count: neededCount,
      borrow_request_status: "DRAFT",
    },
  });
}
