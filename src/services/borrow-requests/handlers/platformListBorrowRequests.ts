// src/services/borrowRequests/handlers/platformListBorrowRequests.ts

import prisma from "@/lib/prisma";
import { presentBorrowRequest } from "../presenters/borrowRequest.presenter";

export async function platformListBorrowRequests(input: {
  accountId: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(input.pageSize || 20)));

  // ✅ Super Admin should NOT see DRAFT and CANCELLED
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    borrow_request_status: {
      notIn: ["DRAFT", "CANCELLED"]
    }
  };

  // Status filter
  const status = (input.status || "").toUpperCase();
  if (status && status !== "ALL") {
    const allowed = [
      "SUBMITTED",
      "APPROVED",
      "ASSIGNED",
      "COMPLETED"
    ];
    if (allowed.includes(status)) {
      where.borrow_request_status = status;
    }
  }

  console.log('🔍 Query where:', where);

  const [total, rawItems] = await Promise.all([
    prisma.borrowRequest.count({ where }),
    prisma.borrowRequest.findMany({
      where,
      orderBy: { borrow_request_created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        fromUniversity: {
          select: {
            university_id: true,
            university_code: true,
            university_name_th: true,
            university_name_en: true,
          }
        },
        requestedBy: {
          select: {
            account_id: true,
            account_username: true,
          },
        },
        assignments: {
          orderBy: { borrow_assigned_at: "desc" },
          include: {
            consultant: {
              include: {
                profile: true,
              },
            },
            consultantUniversity: {
              select: {
                university_id: true,
                university_code: true,
                university_name_th: true,
              }
            }
          },
        },
      },
    }),
  ]);

  console.log('📊 DB Result:', { total, itemsCount: rawItems.length });

  // ✅ แปลงข้อมูลผ่าน presenter
  const items = rawItems.map(presentBorrowRequest);

  return {
    items,
    total,
    page,
    pageSize
  };
}