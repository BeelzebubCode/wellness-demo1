// src/app/api/v1/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });

  // ลบ cookie auth
  res.cookies.set('auth_token', '', {
    path: '/',
    maxAge: 0,
  });

  // เผื่ออนาคตมี admin_token
  res.cookies.set('admin_token', '', {
    path: '/',
    maxAge: 0,
  });

  return res;
}
