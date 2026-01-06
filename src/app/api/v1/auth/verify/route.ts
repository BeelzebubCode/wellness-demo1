// src/app/api/v1/auth/verify/route.ts
// ✅ Robust Verify: Reads token from Authorization / Cookie / Query

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

function extractTokenFromRequest(req: NextRequest): string | null {
  // 1) Authorization: Bearer <token>
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // 2) Cookie (รองรับหลายชื่อ เผื่อโปรเจกต์เก่า/ใหม่)
  const cookieToken =
    req.cookies.get('admin_token')?.value ||
    req.cookies.get('token')?.value ||
    req.cookies.get('access_token')?.value;

  if (cookieToken) return cookieToken;

  // 3) Query ?token=...
  const url = new URL(req.url);
  const q = url.searchParams.get('token');
  if (q) return q;

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    // ถ้า verifyToken คืน null/undefined ให้ถือว่า token ใช้ไม่ได้
    if (!payload) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      account: {
        id: payload.accountId,
        username: payload.username,
        role: payload.role,
        consultantId: payload.consultantId ?? null,
      },
    });
  } catch (err) {
    // ถ้า verifyToken throw ก็ถือว่า invalid เหมือนกัน (ไม่ใช่ 500)
    return NextResponse.json(
      { valid: false, error: 'Invalid token' },
      { status: 401 }
    );
  }
}
