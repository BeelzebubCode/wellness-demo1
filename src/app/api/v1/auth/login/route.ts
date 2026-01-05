import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, verifyPassword } from '@/lib/jwt';

// กำหนด Response Type เพื่อความชัดเจน (Optional)
type LoginResponse = {
  success: boolean;
  token?: string;
  account?: {
    id: number;
    username: string;
    name: string;
    role: string;
    consultantId?: number | null;
  };
  error?: string;
};

export async function POST(request: NextRequest) {
  try {
    // 1. Parse JSON Body
    const body = await request.json();
    const { username, password } = body;

    // 2. Validate Input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    // 3. Find User in Database
    const account = await prisma.account.findUnique({
      where: { 
        account_username: username 
      },
      include: {
        consultant: {
          include: {
            profile: true,
          },
        },
      },
    });

    // 4. Check if User Exists
    if (!account) {
      // Security Tip: ใช้ข้อความเดียวกับรหัสผ่านผิด เพื่อป้องกัน User Enumeration
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // 5. Check Role (Admin Guard)
    // อนุญาตเฉพาะ ADMIN, STAFF, MANAGER, CONSULTANT (แล้วแต่ Logic ของคุณ)
    // แต่ห้าม STUDENT เข้ามา
    if (account.account_role === 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึงระบบ Admin (Role: STUDENT)' },
        { status: 403 }
      );
    }

    // 6. Verify Password
    const isValidPassword = await verifyPassword(password, account.account_password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // 7. Update Last Login Timestamp
    // ใช้ try-catch แยกตรงนี้ เพื่อไม่ให้ Login พังถ้า Update เวลาไม่สำเร็จ (Optional)
    try {
      await prisma.account.update({
        where: { account_id: account.account_id },
        data: { account_last_login_at: new Date() },
      });
    } catch (updateError) {
      console.warn('Failed to update last login time:', updateError);
    }

    // 8. Prepare Payload for Token
    const consultantId = account.consultant?.consultant_id ?? undefined;
    
    // สร้าง Token
    const token = await generateToken({
      accountId: account.account_id,
      username: account.account_username,
      role: account.account_role,
      consultantId: consultantId || undefined,
    });

    // 9. Prepare User Data for Response
    let displayName = account.account_username;
    if (account.consultant?.profile) {
      const { consultant_first_name, consultant_last_name } = account.consultant.profile;
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
        consultantId: consultantId,
      },
    };

    // 10. Create Response & Set Cookie
    const response = NextResponse.json(responseData);

    const cookieOptions = {
      name: 'admin_token',
      value: token,
      httpOnly: true, // สำคัญ! Javascript ฝั่ง Client อ่านไม่ได้ (ป้องกัน XSS)
      secure: process.env.NODE_ENV === 'production', // ใช้ HTTPS เท่านั้นใน Prod
      sameSite: 'lax' as const, // ป้องกัน CSRF
      maxAge: 60 * 60 * 24 * 7, // 7 วัน (วินาที)
      path: '/',
    };

    response.cookies.set(cookieOptions);

    return response;

  } catch (error: any) {
    console.error('[LOGIN_API_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}