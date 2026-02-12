// src/services/borrowRequests/handlers/createBorrowRequest.ts

import prisma from "@/lib/prisma";
import { parseCreateBorrowRequestBody } from "../validators";

export async function createBorrowRequest(params: {
  activeUniversityId: number;
  accountId: number;
  body: unknown;
}) {
  const body = parseCreateBorrowRequestBody(params.body);

  const created = await prisma.borrowRequest.create({
    data: {
      from_university_id: params.activeUniversityId,
      requested_by_account_id: params.accountId,

      borrow_request_title: body.title,
      borrow_request_reason: body.reason,
      
      borrow_request_detail: body.detail ?? null,

      borrow_needed_from: body.neededFrom ? new Date(body.neededFrom) : null,
      borrow_needed_to: body.neededTo ? new Date(body.neededTo) : null,

      borrow_needed_count: body.neededCount ?? 1,
      borrow_request_status: "DRAFT",
    },
  });

  return created;
}
