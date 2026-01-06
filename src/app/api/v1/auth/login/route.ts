import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, verifyPassword } from '@/lib/jwt';

type LoginResponse = {
  success: boolean;
  token?: string;
  account?: {
    id: number;
    username: string;
    name: string;
    role: 'ADMIN' | 'HEAD_CONSULTANT' | 'CONSULTANT' | 'STUDENT';
    consultantId?: number | null;
  };
  error?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = body?.username;
    const password = body?.password;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { account_username: username },
      include: {
        consultant: { include: { profile: true } },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, account.account_password);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // update last login (ไม่ critical)
    prisma.account
      .update({
        where: { account_id: account.account_id },
        data: { account_last_login_at: new Date() },
      })
      .catch(() => {});

    const consultantId = account.consultant?.consultant_id ?? null;

    const token = await generateToken({
      accountId: account.account_id,
      username: account.account_username,
      role: account.account_role,
      consultantId: consultantId ?? undefined,
    });

    let displayName = account.account_username;
    if (account.consultant?.profile) {
      const { consultant_first_name, consultant_last_name } =
        account.consultant.profile;
      displayName = `${consultant_first_name} ${consultant_last_name}`;
    }

    const responseData: LoginResponse = {
      success: true,
      token,
      account: {
        id: account.account_id,
        username: account.account_username,
        name: displayName,
        role: account.account_role,
        consultantId,
      },
    };

    const res = NextResponse.json(responseData);

    // ✅ cookie เดียว ใช้ทุก role
    res.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (e) {
    console.error('[LOGIN_API_ERROR]', e);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed' },
    { status: 405 }
  );
}
