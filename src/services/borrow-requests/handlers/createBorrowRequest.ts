// src/services/borrowRequests/handlers/createBorrowRequest.ts

import prisma from "@/lib/prisma";
import { parseCreateBorrowRequestBody } from "../validators";

export async function createBorrowRequest(params: {
  activeUniversityId: number;
  accountId: number;
  body: unknown;
}) {
  const body = parseCreateBorrowRequestBody(params.body);

  if (body.neededFrom) {
    const targetDate = new Date(body.neededFrom);
    // Ignore time by resetting to start of day
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Find custom policy for the university, or fallback to global default
    let policy = await prisma.consultantBorrowPolicy.findFirst({
      where: {
        university_id: params.activeUniversityId,
        is_active: true,
      },
    });

    if (!policy) {
      policy = await prisma.consultantBorrowPolicy.findFirst({
        where: {
          university_id: null,
          is_active: true,
        },
      });
    }

    const minDays = policy?.borrow_window_days ?? 5; // Default to 5 if no policy exists

    if (diffDays < minDays) {
      throw new Error(`คำขอยืมตัวต้องระบุวันล่วงหน้าอย่างน้อย ${minDays} วัน`);
    }
  }

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
