// src/app/api/v1/auth/verify-admin/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ valid: false }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ valid: false }, { status: 401 });

  if (!['ADMIN', 'HEAD_CONSULTANT'].includes(payload.role)) {
    return NextResponse.json({ valid: false }, { status: 403 });
  }

  return NextResponse.json({ valid: true, account: payload });
}
