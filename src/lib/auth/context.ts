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

  // ✅ Validate account ยังมีอยู่จริง / role ตรง (กัน user ถูกลบ/โดนเปลี่ยน role แล้ว token เก่า)
  const account = await prisma.account.findUnique({
    where: { account_id: jwt.accountId },
    select: {
      account_id: true,
      account_username: true,
      account_role: true,
      account_home_university_id: true,
    },
  });
  if (!account) return null;

  // ✅ เอา allowed/active จาก JWT เป็น baseline (fast + consistent กับ login)
  const allowedFromJwt = Array.isArray(jwt.allowedUniversityIds)
    ? jwt.allowedUniversityIds.filter((n) => Number.isFinite(n))
    : [];

  // ✅ แล้ว “ค่อย” merge กับ access ปัจจุบันจาก DB (กันกรณี revoke แล้ว token ยังมี)
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

  // ✅ active: ใช้จาก JWT ก่อน แล้วค่อยให้ header override (ถ้ามีและอยู่ใน allowed)
  let activeUniversityId =
    (Number.isFinite(jwt.activeUniversityId) ? jwt.activeUniversityId : undefined) ??
    (account.account_home_university_id ?? undefined);

  const h = req.headers.get("x-university-id");
  const requested = h ? Number(h) : NaN;
  if (Number.isFinite(requested) && allowedUniversityIds.includes(requested)) {
    activeUniversityId = requested;
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
