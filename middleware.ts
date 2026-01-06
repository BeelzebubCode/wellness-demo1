// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ อนุญาตหน้า login
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // ✅ กันเฉพาะ /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
