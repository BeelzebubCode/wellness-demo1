import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

function extractToken(req: NextRequest): string | null {
  const auth =
    req.headers.get('authorization') ||
    req.headers.get('Authorization') ||
    '';

  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  const cookieToken =
    req.cookies.get('admin_token')?.value ||
    req.cookies.get('auth_token')?.value;

  if (cookieToken) return cookieToken;

  const q = new URL(req.url).searchParams.get('token');
  if (q) return q;

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { valid: false, error: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // ✅ เช็คว่าเป็น consultant จริง
    if (!payload.consultantId) {
      return NextResponse.json(
        { valid: false, error: 'FORBIDDEN' },
        { status: 403 }
      );
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
  } catch {
    return NextResponse.json(
      { valid: false, error: 'INVALID_TOKEN' },
      { status: 401 }
    );
  }
}
