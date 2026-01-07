// src/app/api/v1/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAccountFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const account = await getAccountFromRequest(req);

  if (!account) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: account.accountId,
      username: account.username,
      role: account.role,
      studentId: account.studentId ?? null,
      consultantId: account.consultantId ?? null,
    },
  });
}
