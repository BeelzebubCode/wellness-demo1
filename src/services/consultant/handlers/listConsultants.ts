import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { AccountRole } from "@prisma/client";

function isStaff(role: AccountRole) {
  return role === "HEAD_CONSULTANT" || role === "RECTOR" || role === "SUPER_ADMIN";
}

export async function handleListConsultants(
  ctx: AccountContext & { activeUniversityId?: number },
  input?: { organizationId?: number | null; includeBorrowed?: boolean },
) {
  const role = ctx.role as AccountRole;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  const now = new Date();

  // ✅ สำคัญ: default = false (ตาม requirement: head NU เห็นเฉพาะ NU)
  const includeBorrowed = input?.includeBorrowed ?? false;

  const where = {
    ...(typeof input?.organizationId === "number"
      ? { organization_id: input.organizationId }
      : {}),

    ...(includeBorrowed
      ? {
          OR: [
            { university_id: activeUniversityId },
            {
              borrowAssignments: {
                some: {
                  borrow_assign_start_at: { lte: now },
                  borrow_assign_end_at: { gte: now },
                  borrowRequest: {
                    from_university_id: activeUniversityId,
                    borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
                  },
                },
              },
            },
          ],
        }
      : {
          university_id: activeUniversityId,
        }),
  };

  const consultants = await prisma.consultant.findMany({
    where,
    select: {
      consultant_id: true,
      university_id: true,
      profile: {
        select: {
          consultant_first_name: true,
          consultant_last_name: true,
        },
      },
    },
    orderBy: { consultant_created_at: "desc" },
  });

  const formatted = consultants
    .map((c) => {
      const name = c.profile
        ? `${c.profile.consultant_first_name} ${c.profile.consultant_last_name}`.trim()
        : null;

      if (!name) return null;

      return {
        id: c.consultant_id, // ✅ id = consultant_id เสมอ
        consultantId: c.consultant_id,
        universityId: c.university_id,
        name,
      };
    })
    .filter(Boolean);

  // ✅ ส่ง activeUniversityId กลับไปด้วย เพื่อ debug ว่ามันถือมหาลัยไหน
  return NextResponse.json({
    success: true,
    activeUniversityId,
    includeBorrowed,
    consultants: formatted,
  });
}
