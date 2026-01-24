// src/lib/auth/context.ts

import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken, JWTPayload } from "./jwt";

export type AccountContext = {
  accountId: number;
  username: string;
  role: JWTPayload["role"];

  consultantId?: number;
  studentId?: number;

  homeUniversityId?: number;
  activeUniversityId?: number;
  allowedUniversityIds: number[];
};

export async function getAccountFromRequest(
  req: NextRequest
): Promise<AccountContext | null> {
  const token = extractToken(req);
  if (!token) return null;

  const jwt = await verifyToken(token);
  if (!jwt) return null;

  // ✅ Validate account ยังอยู่จริง (เลือก field เท่าที่จำเป็น)
  const account = await prisma.account.findUnique({
    where: { account_id: jwt.accountId },
    select: {
      account_id: true,
      account_username: true,
      account_role: true,
      account_home_university_id: true,
      // ถ้าคุณมี account_token_version: true ก็เอามาเทียบกับ jwt.tv ได้
    },
  });
  if (!account) return null;

  // ✅ allowed จาก JWT + merge กับ DB accesses ปัจจุบัน (กัน revoke)
  const allowedFromJwt = Array.isArray(jwt.allowedUniversityIds)
    ? jwt.allowedUniversityIds.filter((n) => Number.isFinite(n))
    : [];

  const accesses = await prisma.accountUniversityAccess.findMany({
    where: { account_id: account.account_id, access_revoked_at: null },
    select: { university_id: true },
  });

  const allowedUniversityIds = Array.from(
    new Set([
      ...(account.account_home_university_id ? [account.account_home_university_id] : []),
      ...allowedFromJwt,
      ...accesses.map((a) => a.university_id),
    ])
  ).sort((a, b) => a - b);

  // ✅ active: jwt.active -> header override -> fallback home -> fallback first allowed
  let activeUniversityId =
    (Number.isFinite(jwt.activeUniversityId) ? jwt.activeUniversityId : undefined) ??
    (account.account_home_university_id ?? undefined);

  const h = req.headers.get("x-university-id");
  const requested = h ? Number(h) : NaN;
  if (Number.isFinite(requested) && allowedUniversityIds.includes(requested)) {
    activeUniversityId = requested;
  }

  // ✅ safety: active ต้องอยู่ใน allowed (กัน active หลุด)
  if (activeUniversityId && !allowedUniversityIds.includes(activeUniversityId)) {
    activeUniversityId = allowedUniversityIds[0] ?? undefined;
  }

  return {
    accountId: account.account_id,
    username: account.account_username,
    role: account.account_role,
    consultantId: jwt.consultantId,
    studentId: jwt.studentId,
    homeUniversityId: account.account_home_university_id ?? undefined,
    activeUniversityId,
    allowedUniversityIds,
  };
}
