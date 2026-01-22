// src/lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-secret"
);

export type Role =
  | "HEAD_CONSULTANT"
  | "CONSULTANT"
  | "STUDENT"
  | "SUPER_ADMIN"
  | "RECTOR";

export type JWTPayload = {
  accountId: number;
  username: string;
  role: Role;

  consultantId?: number;
  studentId?: number;

  homeUniversityId?: number;
  activeUniversityId?: number;
  allowedUniversityIds?: number[];
};

export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function extractToken(req: NextRequest): string | null {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  return req.cookies.get("auth_token")?.value ?? null;
}
