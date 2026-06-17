import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/admin', '/supplier', '/client', '/operator'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes and public assets through
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Check Supabase session cookie (set by @supabase/ssr on sign-in)
  const hasSession =
    request.cookies.has('sb-laiohanxhxhvicyqrvwe-auth-token') ||
    request.cookies.has('nakheel_session');

  if (PROTECTED_PATHS.some(p => pathname.startsWith(p)) && !hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/supplier/:path*', '/client/:path*', '/operator/:path*'],
};
