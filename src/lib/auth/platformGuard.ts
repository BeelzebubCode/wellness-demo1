// src/lib/auth/platformGuard.ts
import type { NextRequest } from "next/server";
import { getAccountFromRequest } from "@/lib/auth/context"; 
import type { Role } from "@/lib/auth/jwt";

type GuardOk = { ok: true; account: Awaited<ReturnType<typeof getAccountFromRequest>> extends infer T ? T : any };
type GuardFail = { ok: false; status: 401 | 403; error: "UNAUTH" | "FORBIDDEN" };

export async function requirePlatformRole(
  req: NextRequest,
  roles: readonly Role[],
): Promise<GuardOk | GuardFail> {
  const account = await getAccountFromRequest(req);
  if (!account) return { ok: false, status: 401, error: "UNAUTH" };

  if (!roles.includes(account.role)) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }

  // ✅ platform zone: ไม่ require tenant
  return { ok: true, account };
}

// helper เฉพาะ super admin
export function requireSuperAdmin(req: NextRequest) {
  return requirePlatformRole(req, ["SUPER_ADMIN"] as const);
}
