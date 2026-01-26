import prisma from "@/lib/prisma";

export async function createBorrowRequest(input: {
  universityId: number;
  requestedByAccountId: number;
  title: string;
  reason: string;
  detail?: string | null;
  neededFrom?: string | Date | null;
  neededTo?: string | Date | null;
  neededCount?: number | null;
}) {
  const title = String(input.title || "").trim();
  const reason = String(input.reason || "").trim();
  if (!title) throw new Error("TITLE_REQUIRED");
  if (!reason) throw new Error("REASON_REQUIRED");

  const neededCount = input.neededCount == null ? 1 : Number(input.neededCount);
  if (!Number.isFinite(neededCount) || neededCount <= 0) throw new Error("INVALID_NEEDED_COUNT");

  const neededFrom = input.neededFrom ? new Date(input.neededFrom) : null;
  const neededTo = input.neededTo ? new Date(input.neededTo) : null;

  return prisma.borrowRequest.create({
    data: {
      from_university_id: input.universityId,
      requested_by_account_id: input.requestedByAccountId,

      borrow_request_title: title,
      borrow_request_reason: reason,
      borrow_request_detail: input.detail ?? null,

      borrow_needed_from: neededFrom,
      borrow_needed_to: neededTo,

      borrow_needed_count: neededCount,
      borrow_request_status: "DRAFT",
    },
  });
}
