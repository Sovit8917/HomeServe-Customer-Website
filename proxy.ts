import { NextRequest, NextResponse } from 'next/server';

// Routes that must stay reachable WITHOUT being logged in.
// NOTE: '/login' uses a prefix check below (not just an exact match) so it
// also covers '/login/complete' — the page Google OAuth redirects back to.
// Without that, this proxy would bounce the browser back to /login before
// /login/complete's own code ever runs to finish signing the user in.
const PUBLIC_PREFIXES = ['/login', '/forgot-password', '/reset-password'];

// Static/next-internal paths that should never be gated.
function isAssetPath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api') ||
    /\.(png|jpg|jpeg|svg|ico|webp|css|js|map)$/.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAssetPath(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Run on every route except the ones above (matcher is just an optimization —
// the real check happens in the function body).
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
