// src/lib/auth/guard.ts

import { NextResponse } from "next/server";
import type { AccountContext } from "./context";

export function requireAuth(ctx: AccountContext | null) {
  if (!ctx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}

export function requireRole(ctx: AccountContext, roles: AccountContext["role"][]) {
  if (!roles.includes(ctx.role)) {
    return NextResponse.json({ success: false, error: "Forbidden: role" }, { status: 403 });
  }
}

export function requireTenant(ctx: AccountContext) {
  if (!ctx.activeUniversityId) {
    return NextResponse.json({ success: false, error: "Unauthorized: tenant" }, { status: 401 });
  }
}

export function requireUniversity(ctx: AccountContext, universityId: number) {
  if (!ctx.allowedUniversityIds.includes(universityId)) {
    return NextResponse.json({ success: false, error: "Forbidden: university" }, { status: 403 });
  }
}
