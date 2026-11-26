import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';
import { SIGN_IN_PATH } from '@/lib/auth-redirect';

// Routes under these prefixes need a signed-in user. Keep `config.matcher` below in sync.
const PROTECTED_PREFIXES = ['/account'];

// A first line only: this checks that a session cookie exists, not that it is valid, so that
// signed-out visitors are sent to sign in without loading the page. The real check is
// `getSession()` from '@/lib/auth' in the page, action or route handler itself.
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !getSessionCookie(request)) {
    const signInUrl = new URL(SIGN_IN_PATH, request.url);
    signInUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// The proxy only runs for these paths, so every other page stays static and session-free.
export const config = {
  matcher: ['/account/:path*'],
};
