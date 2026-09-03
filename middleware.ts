import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get('impactbridge_auth')?.value);

  if (pathname === '/' && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (pathname.startsWith('/auth') && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/auth/:path*'],
};
