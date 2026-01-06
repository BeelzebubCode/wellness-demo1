// src/app/api/v1/auth/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

function extractTokenFromRequest(req: NextRequest): string | null {
  // 1) Authorization: Bearer <token>
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // 2) Cookie
  const cookieToken =
    req.cookies.get('admin_token')?.value ||
    req.cookies.get('token')?.value ||
    req.cookies.get('access_token')?.value;

  if (cookieToken) return cookieToken;

  // 3) Query ?token=
  const q = new URL(req.url).searchParams.get('token');
  if (q) return q;

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'NO_TOKEN' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false, error: 'INVALID_TOKEN' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 🔒 กัน role ที่ไม่ควรเข้า admin
    if (!['ADMIN', 'HEAD_CONSULTANT'].includes(payload.role)) {
      return NextResponse.json(
        { valid: false, error: 'FORBIDDEN' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const res = NextResponse.json({
      valid: true,
      account: {
        id: payload.accountId,
        username: payload.username,
        role: payload.role,
        consultantId: payload.consultantId ?? null,
      },
    });

    res.headers.set('Cache-Control', 'no-store');

    return res;
  } catch {
    return NextResponse.json(
      { valid: false, error: 'INVALID_TOKEN' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
