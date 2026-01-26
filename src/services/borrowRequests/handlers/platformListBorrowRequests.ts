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
  if (input.status && input.status !== "ALL") where.borrow_request_status = input.status;
  if (input.fromUniversityId) where.from_university_id = input.fromUniversityId;

  const q = (input.q || "").trim();
  if (q) {
    where.OR = [
      { borrow_request_title: { contains: q, mode: "insensitive" } },
      { borrow_request_reason: { contains: q, mode: "insensitive" } },
      { fromUniversity: { university_name_th: { contains: q, mode: "insensitive" } } },
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
        requestedBy: { select: { account_id: true, account_username: true } },
        assignments: {
          orderBy: { borrow_assigned_at: "desc" },
          take: 3,
          include: { consultant: { include: { profile: true } } },
        },
      },
    }),
  ]);

  return { total, page, pageSize, items };
}
