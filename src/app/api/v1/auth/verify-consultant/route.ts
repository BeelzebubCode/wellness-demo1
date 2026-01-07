// src/app/api/v1/auth/verify-consultant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  if (!payload.consultantId) {
    return NextResponse.json({ valid: false }, { status: 403 });
  }

  return NextResponse.json({
    valid: true,
    account: {
      id: payload.accountId,
      username: payload.username,
      role: payload.role,
      consultantId: payload.consultantId,
    },
  });
}
