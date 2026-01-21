// src/lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export type Role = "ADMIN" | "HEAD_CONSULTANT" | "CONSULTANT" | "STUDENT";

export type AuthPayload = {
  accountId: number;
  username: string;
  role: Role;
  consultantId?: number;
  homeUniversityId?: number;
  allowedUniversityIds?: number[];
  // exp/iat อยู่ใน JWT ตามที่คุณ generateToken ใส่ไว้ก็ได้
};

export function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("auth_token")?.value ?? null;
}

export async function getAuth(req: NextRequest): Promise<AuthPayload | null> {
  const token = extractToken(req);
  if (!token) return null;

  const payload = (await verifyToken(token)) as AuthPayload | null;
  return payload ?? null;
}

export function deny(status: number, message = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function requireAuth(req: NextRequest) {
  const payload = await getAuth(req);
  if (!payload) return { ok: false as const, res: deny(401, "Unauthorized") };
  return { ok: true as const, payload };
}

export function requireRole(payload: AuthPayload, roles: Role[]) {
  if (!roles.includes(payload.role)) {
    return { ok: false as const, res: deny(403, "Forbidden: role") };
  }
  return { ok: true as const };
}

export function requireUniversityAccess(payload: AuthPayload, universityId: number) {
  const allowed = payload.allowedUniversityIds ?? [];
  if (!allowed.includes(universityId)) {
    return { ok: false as const, res: deny(403, "Forbidden: university") };
  }
  return { ok: true as const };
}
