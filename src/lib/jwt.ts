// src/lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-key-change-in-production"
);

export interface JWTPayload {
  accountId: number;
  username: string;
  role: string;
  consultantId?: number;

  homeUniversityId?: number;
  activeUniversityId?: number;
  allowedUniversityIds?: number[];
}

export interface AccountContext extends JWTPayload {
  studentId?: number;
  homeUniversityId?: number;
  activeUniversityId?: number;
  allowedUniversityIds?: number[];
}

// =======================
// JWT
// =======================
export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

function isValidPayload(p: any): p is JWTPayload {
  return (
    p &&
    typeof p.accountId === "number" &&
    typeof p.username === "string" &&
    typeof p.role === "string"
  );
}

function parseOptionalNumber(v: any): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

// ✅ เพิ่ม: parse array ของตัวเลข (รองรับ token claim ที่เป็น string/number)
function parseNumberArray(v: any): number[] | undefined {
  if (!Array.isArray(v)) return undefined;

  const arr = v
    .map((x) => parseOptionalNumber(x))
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);

  if (!arr.length) return undefined;
  return Array.from(new Set(arr));
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const clean = token.trim();
    if (!clean) return null;

    const { payload } = await jwtVerify(clean, JWT_SECRET);

    const p = payload as any;
    if (!isValidPayload(p)) return null;

    const consultantId = parseOptionalNumber((payload as any)?.consultantId);
    const homeUniversityId = parseOptionalNumber((payload as any)?.homeUniversityId);
    const activeUniversityId = parseOptionalNumber((payload as any)?.activeUniversityId);
    const allowedUniversityIds = parseNumberArray((payload as any)?.allowedUniversityIds);

    return {
      accountId: (payload as any).accountId,
      username: (payload as any).username,
      role: (payload as any).role,
      consultantId,
      homeUniversityId,
      activeUniversityId,
      allowedUniversityIds, // ✅ เพิ่ม
    };
  } catch {
    return null;
  }
}

export function extractToken(request: NextRequest): string | null {
  const auth =
    request.headers.get("authorization") ||
    request.headers.get("Authorization") ||
    "";

  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // ✅ FIX: เพิ่ม auth_token (สำคัญมาก)
  const cookieToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("admin_token")?.value ||
    request.cookies.get("access_token")?.value ||
    request.cookies.get("token")?.value;

  if (cookieToken) return cookieToken;

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("token");
    if (q) return q.trim();
  } catch {
    // ignore
  }

  return null;
}

/** อ่าน "active university" จาก header/cookie (สำหรับ staff ที่สลับมหาลัยได้) */
function getRequestedUniversityId(request: NextRequest): number | null {
  // header (แนะนำให้ใช้)
  const h =
    request.headers.get("x-university-id") ||
    request.headers.get("X-University-Id") ||
    null;

  const fromHeader = h ? Number(h) : NaN;
  if (Number.isFinite(fromHeader) && fromHeader > 0) return fromHeader;

  // cookie (ถ้าคุณทำ switcher แล้วค่อย set)
  const c = request.cookies.get("active_university_id")?.value;
  const fromCookie = c ? Number(c) : NaN;
  if (Number.isFinite(fromCookie) && fromCookie > 0) return fromCookie;

  return null;
}

// =======================
// Password (bcrypt)
// =======================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// =======================
// Helper for API Route (✅ เพิ่ม tenant context ที่นี่)
// =======================
export async function getAccountFromRequest(
  request: NextRequest
): Promise<AccountContext | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // 1) โหลด account เพิ่ม เพื่อรู้ homeUniversityId (source of truth)
  const acc = await prisma.account.findUnique({
    where: { account_id: payload.accountId },
    select: {
      account_id: true,
      account_role: true,
      account_home_university_id: true,
    },
  });

  if (!acc) return null;

  const homeUniversityId = acc.account_home_university_id ?? undefined;

  // 2) หาสิทธิ์ข้ามมหาลัย (allowedUniversityIds)
  const accessRows = await prisma.accountUniversityAccess.findMany({
    where: {
      account_id: payload.accountId,
      access_revoked_at: null,
    },
    select: { university_id: true },
  });

  const allowedUniversityIds = Array.from(
    new Set([
      ...(homeUniversityId ? [homeUniversityId] : []),
      ...accessRows.map((r) => r.university_id),
    ])
  );

  // 3) resolve activeUniversityId (default = home)
  let activeUniversityId: number | undefined = homeUniversityId;

  const requestedUniId = getRequestedUniversityId(request);
  if (requestedUniId && allowedUniversityIds.includes(requestedUniId)) {
    activeUniversityId = requestedUniId;
  }

  // 4) เติม studentId / consultantId จาก DB + lock tenant ให้ถูกต้อง
  let studentId: number | undefined = undefined;
  let consultantId: number | undefined = payload.consultantId;

  // STUDENT: บังคับ active = uni ของ student (กันหลุด)
  if (acc.account_role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { account_id: payload.accountId },
      select: { student_id: true, university_id: true },
    });

    studentId = student?.student_id;
    if (student?.university_id) {
      activeUniversityId = student.university_id;
    }
  }

  // CONSULTANT: ถ้า token ไม่มี consultantId ให้ดึงจาก DB + ✅ lock tenant ชัด ๆ
  if (acc.account_role === "CONSULTANT") {
    const c = await prisma.consultant.findFirst({
      where: { account_id: payload.accountId },
      select: { consultant_id: true, university_id: true },
    });

    consultantId = consultantId ?? c?.consultant_id;

    // ✅ consultant ปกติควรอยู่มหาลัยเดียว → lock เลย
    if (c?.university_id) {
      activeUniversityId = c.university_id;
    }
  }

  return {
    ...payload,
    role: acc.account_role, // ใช้ role จาก DB เป็นหลัก กัน token เพี้ยน
    studentId,
    consultantId,
    homeUniversityId,
    activeUniversityId,
    allowedUniversityIds,
  };
}
