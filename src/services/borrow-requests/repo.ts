import prisma from "@/lib/prisma";

export async function getBorrowRequestById(borrowRequestId: number) {
  return prisma.borrowRequest.findUnique({
    where: { borrow_request_id: borrowRequestId },
    include: {
      fromUniversity: true,
      requestedBy: { select: { account_id: true, roleCategory: { select: { code: true } } } },
      assignments: true,
    },
  });
}

export async function listPlatformBorrowRequests(params: {
  status?: string;
  take?: number;
  skip?: number;
}) {
  const { status, take = 50, skip = 0 } = params;

  return prisma.borrowRequest.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: status ? { borrow_request_status: status as any } : undefined,
    orderBy: { borrow_request_created_at: "desc" },
    take,
    skip,
    include: {
      fromUniversity: true,
    },
  });
}

export async function listActiveUniversitiesExclude(universityId: number) {
  return prisma.university.findMany({
    where: {
      university_is_active: true,
      university_id: { not: universityId },
    },
    select: {
      university_id: true,
      university_code: true,
      university_name_th: true,
      university_latitude: true,
      university_longitude: true,
    },
  });
}



export async function getBorrowWindowDays(universityId?: number | null) {
  // priority: policy เฉพาะมหาลัย → fallback global
  const policy =
    (universityId
      ? await prisma.consultantBorrowPolicy.findFirst({
        where: { university_id: universityId, is_active: true },
        orderBy: { created_at: "desc" },
      })
      : null) ??
    (await prisma.consultantBorrowPolicy.findFirst({
      where: { university_id: null, is_active: true },
      orderBy: { created_at: "desc" },
    }));

  return policy?.borrow_window_days ?? 14; // default 14 วัน
}
