import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
// AccountRole is now a string (VARCHAR) — no longer a Prisma enum
// Keep Role as string type for backward compat
export type Role = string;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-secret"
);

export type JWTPayload = {
  ver: 1;

  accountId: number;
  username: string;
  role: Role;

  consultantId?: number;
  studentId?: number;

  homeUniversityId?: number;
  activeUniversityId?: number;
  allowedUniversityIds?: number[];

  // optional: kill token
  tv?: number;
};

export async function generateToken(payload: Omit<JWTPayload, "ver">): Promise<string> {
  const p: JWTPayload = { ver: 1, ...payload };
  return new SignJWT(p as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const p = payload as unknown as JWTPayload;
    if (!p || p.ver !== 1) return null;
    return p;
  } catch {
    return null;
  }
}

export function extractToken(req: NextRequest): string | null {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  return req.cookies.get("auth_token")?.value ?? null;
}

export type AccountFromRequest = {
  accountId: number;
  username: string;
  role: Role;
  consultantId?: number;
  studentId?: number;

  homeUniversityId?: number;
  activeUniversityId?: number;
  allowedUniversityIds?: number[];

  tv?: number;
};

// Note: getAccountFromRequest was in jwt.ts but used Prisma.
// We cannot move getAccountFromRequest to here because it uses Prisma.
// Middleware won't use getAccountFromRequest (it only verifies token).
