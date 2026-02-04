import prisma from "@/lib/prisma";

export async function getBorrowRequestById(borrowRequestId: number) {
  return prisma.borrowRequest.findUnique({
    where: { borrow_request_id: borrowRequestId },
    include: {
      fromUniversity: true,
      requestedBy: { select: { account_id: true, account_role: true } },
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

export async function listOnCallShiftsForUniversities(params: {
  universityIds: number[];
  requestStart?: Date | null;
  requestEnd?: Date | null;
  windowStart: Date;
  windowEnd: Date;
}) {
  const { universityIds, requestStart, requestEnd, windowStart, windowEnd } = params;

  // overlap with request range if provided
  const overlapFilter =
    requestStart && requestEnd
      ? {
          AND: [
            { on_call_start_at: { lt: requestEnd } },
            { on_call_end_at: { gt: requestStart } },
          ],
        }
      : undefined;

  return prisma.borrowOnCallShift.findMany({
    where: {
      consultant_university_id: { in: universityIds },
      on_call_status: { in: ["SCHEDULED", "ACTIVE"] as any },
      on_call_start_at: { gte: windowStart, lte: windowEnd },
      ...(overlapFilter ?? {}),
    },
    include: {
      consultant: {
        include: {
          profile: true,
          specializations: true,
        },
      },
      university: true,
    },
    orderBy: { on_call_start_at: "asc" },
  });
}

export async function getBorrowWindowDays(universityId?: number | null) {
  // priority: policy เฉพาะมหาลัย → fallback global
  const policy =
    (universityId
      ? await prisma.borrowWindowPolicy.findFirst({
          where: { university_id: universityId, is_active: true },
          orderBy: { created_at: "desc" },
        })
      : null) ??
    (await prisma.borrowWindowPolicy.findFirst({
      where: { university_id: null, is_active: true },
      orderBy: { created_at: "desc" },
    }));

  return policy?.borrow_window_days ?? 14; // default 14 วัน
}
