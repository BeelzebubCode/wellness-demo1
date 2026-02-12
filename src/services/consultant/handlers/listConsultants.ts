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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  // const now = new Date();

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
                // borrow_assign_start_at: { lte: now },
                // borrow_assign_end_at: { gte: now },
                borrowRequest: {
                  from_university_id: activeUniversityId,
                  // ✅ User request: Don't show if COMPLETED (Assignee disappears after work done)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
                },
              },
            },
          },
          // ✅ Ghost Accounts (AccountUniversityAccess) -- REVERTED per user request
          // {
          //   account: {
          //     universityAccesses: {
          //       some: {
          //         university_id: activeUniversityId,
          //         access_revoked_at: null,
          //         access_role: { in: ["CONSULTANT", "HEAD_CONSULTANT"] as any },
          //       },
          //     },
          //   },
          // },
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
      university: { select: { university_code: true } },
      profile: {
        select: {
          consultant_first_name: true,
          consultant_last_name: true,
        },
      },
      // ✅ Select borrow assignments to get the ID for cross-university booking assignment
      borrowAssignments: {
        where: {
          borrowRequest: {
            from_university_id: activeUniversityId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
          },
          // borrow_assign_start_at: { lte: now },
          // borrow_assign_end_at: { gte: now },
        },
        select: {
          borrow_assignment_id: true,
        },
        take: 1, // Should only have one active at a time for this uni
      },
    },
    orderBy: { consultant_created_at: "desc" },
  });

  const formatted = consultants
    .map((c) => {
      const nameRaw = c.profile
        ? `${c.profile.consultant_first_name} ${c.profile.consultant_last_name}`.trim()
        : null;

      if (!nameRaw) return null;

      let name = nameRaw;
      if (c.university_id !== activeUniversityId && c.university?.university_code) {
        name = `${name} (${c.university.university_code})`;
      }

      // unique borrowAssignmentId for this context
      const borrowAssignmentId = c.borrowAssignments?.[0]?.borrow_assignment_id ?? null;

      return {
        id: c.consultant_id, // ✅ id = consultant_id เสมอ
        consultantId: c.consultant_id,
        universityId: c.university_id,
        borrowAssignmentId,
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
