// src/lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-secret"
);

export type Role =
  | "STUDENT"
  | "CONSULTANT"
  | "HEAD_CONSULTANT"
  | "SUPER_ADMIN"
  | "RECTOR";

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

  // optional: kill token เวลาปรับสิทธิ์
  tv?: number;
};

// ✅ ใช้ใน login route
export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

// ✅ (optional) ถ้าคุณมีหน้า register/admin create user
export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

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
