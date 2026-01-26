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
  input?: { organizationId?: number | null },
) {
  const role = ctx.role as AccountRole;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  // ✅ tenant guard
  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  const consultants = await prisma.consultant.findMany({
    where: {
      university_id: activeUniversityId,
      ...(typeof input?.organizationId === "number"
        ? { organization_id: input.organizationId }
        : {}),
    },
    select: {
      consultant_id: true,
      profile: { select: { consultant_first_name: true, consultant_last_name: true } },
    },
    orderBy: { consultant_created_at: "desc" },
  });

  const formatted = consultants
    .map((c) => {
      const name = c.profile
        ? `${c.profile.consultant_first_name} ${c.profile.consultant_last_name}`.trim()
        : null;
      if (!name) return null;
      return { id: c.consultant_id, name };
    })
    .filter(Boolean);

  return NextResponse.json({ success: true, consultants: formatted });
}
