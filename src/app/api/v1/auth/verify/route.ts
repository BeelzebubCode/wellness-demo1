// src/app/api/v1/auth/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }

  return req.cookies.get('auth_token')?.value ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ valid: false }, { status: 401 });
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
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
