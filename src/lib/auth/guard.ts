// src/lib/auth/guard.ts
import { NextResponse } from "next/server";
import type { AccountContext } from "./context";

export function requireRole(
  ctx: AccountContext,
  roles: AccountContext["role"][]
) {
  if (!roles.includes(ctx.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: role" },
      { status: 403 }
    );
  }
}

export function requireUniversity(
  ctx: AccountContext,
  universityId: number
) {
  if (!ctx.allowedUniversityIds.includes(universityId)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: university" },
      { status: 403 }
    );
  }
}
