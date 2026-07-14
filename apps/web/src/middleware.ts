import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  if (path.startsWith('/admin')) {
    const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3002';
    return NextResponse.redirect(new URL(adminUrl));
  }

  if (path.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      const signInUrl = new URL('/api/auth/signin', nextUrl);
      signInUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};