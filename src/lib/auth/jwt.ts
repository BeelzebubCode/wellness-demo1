import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
// AccountRole is now a string (VARCHAR) in the database, not an enum

// ✅ Re-export token logic
export * from "./token";

// ✅ Import types/funcs needed for local functions
import { verifyToken, extractToken, JWTPayload, AccountFromRequest } from "./token";

// ✅ Keep password logic (Node.js/Bcrypt dependency)
export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

// ✅ Keep getAccountFromRequest (Prisma dependency)
// We need to re-implement or import it here if it wasn't moved.
// In the previous step I didn't move it because it depends on Prisma.
// So I keep it here.

export async function getAccountFromRequest(
  req: NextRequest
): Promise<AccountFromRequest | null> {
  const token = extractToken(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    accountId: payload.accountId,
    username: payload.username,
    role: payload.role,
    consultantId: payload.consultantId,
    studentId: payload.studentId,
    homeUniversityId: payload.homeUniversityId,
    activeUniversityId: payload.activeUniversityId,
    allowedUniversityIds: payload.allowedUniversityIds,
    tv: payload.tv,
  };
}
