// src/lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

export interface JWTPayload {
  accountId: number;
  username: string;
  role: string;
  consultantId?: number;
}

export interface AccountContext extends JWTPayload {
  studentId?: number;
}

// =======================
// JWT
// =======================
export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

function isValidPayload(p: any): p is JWTPayload {
  return (
    p &&
    typeof p.accountId === 'number' &&
    typeof p.username === 'string' &&
    typeof p.role === 'string'
  );
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const clean = token.trim();
    if (!clean) return null;

    const { payload } = await jwtVerify(clean, JWT_SECRET);

    // jose payload เป็น object กว้าง ๆ เลย validate เบื้องต้นกันพัง
    const p = payload as any;
    if (!isValidPayload(p)) return null;

    // consultantId อาจมาเป็น number หรือ string ได้ (กันเคสแปลก ๆ)
    const rawConsultantId = (payload as any)?.consultantId;

    let consultantId: number | undefined = undefined;

    if (typeof rawConsultantId === 'number') {
      consultantId = rawConsultantId;
    } else if (typeof rawConsultantId === 'string') {
      const s = rawConsultantId.trim();
      if (s !== '') {
        const n = Number(s);
        consultantId = Number.isFinite(n) ? n : undefined;
      }
    }

    // แล้วค่อย return
    return {
      accountId: (payload as any).accountId,
      username: (payload as any).username,
      role: (payload as any).role,
      consultantId,
    };

  } catch {
    return null;
  }
}

export function extractToken(request: NextRequest): string | null {
  const auth =
    request.headers.get('authorization') ||
    request.headers.get('Authorization') ||
    '';

  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // ✅ FIX: เพิ่ม auth_token (สำคัญมาก)
  const cookieToken =
    request.cookies.get('auth_token')?.value ||   // 👈 เพิ่มบรรทัดนี้
    request.cookies.get('admin_token')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value;

  if (cookieToken) return cookieToken;

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('token');
    if (q) return q.trim();
  } catch {
    // ignore
  }

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
// Helper for API Route
// =======================
export async function getAccountFromRequest(
  request: NextRequest
): Promise<AccountContext | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  let studentId: number | undefined = undefined;

  if (payload.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { account_id: payload.accountId },
      select: { student_id: true },
    });

    studentId = student?.student_id;
  }

  return {
    ...payload,
    studentId,
  };
}
