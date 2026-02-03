// src/services/borrowRequests/handlers/platformListBorrowRequests.ts

import prisma from "@/lib/prisma";

export async function platformListBorrowRequests(input: {
  accountId: number;
  status?: string;
  fromUniversityId?: number;
  q?: string;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(input.pageSize || 20)));

  const where: any = {};

  // ✅ SUPER_ADMIN → ไม่ต้องจำกัดมหาลัย
  // ❌ อย่ามี logic NO_ALLOWED_UNIVERSITIES ตรงนี้

  // ===== status =====
  const status = (input.status || "").toUpperCase();
  if (status && status !== "ALL") {
    const allowed = [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "ASSIGNED",
      "COMPLETED",
      "CANCELLED",
    ];
    if (allowed.includes(status)) {
      where.borrow_request_status = status;
    }
  }

  // ===== filter มหาลัย (optional) =====
  if (input.fromUniversityId) {
    where.from_university_id = input.fromUniversityId;
  }

  // ===== search =====
  const q = (input.q || "").trim();
  if (q) {
    where.OR = [
      { borrow_request_title: { contains: q, mode: "insensitive" } },
      { borrow_request_reason: { contains: q, mode: "insensitive" } },
      {
        fromUniversity: {
          is: {
            university_name_th: { contains: q, mode: "insensitive" },
          },
        },
      },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.borrowRequest.count({ where }),
    prisma.borrowRequest.findMany({
      where,
      orderBy: { borrow_request_created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        fromUniversity: true,
        requestedBy: {
          select: {
            account_id: true,
            account_username: true,
          },
        },
        assignments: {
          orderBy: { borrow_assigned_at: "desc" },
          take: 3,
          include: {
            consultant: {
              include: { profile: true },
            },
          },
        },
      },
    }),
  ]);

  return { total, page, pageSize, items };
}
