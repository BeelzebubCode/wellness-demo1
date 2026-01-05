// src/app/api/v1/auth/verify/route.ts
// ✅ Fixed: Uses Account model from schema

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    
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
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}