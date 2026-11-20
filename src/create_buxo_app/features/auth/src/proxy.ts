import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Routes under these prefixes need a signed-in user. Keep `config.matcher` below in sync.
const PROTECTED_PREFIXES = ['/account'];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !request.auth) {
    const signInUrl = new URL('/api/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

// The proxy only runs for these paths, so every other page stays static and session-free.
export const config = {
  matcher: ['/account/:path*'],
};
