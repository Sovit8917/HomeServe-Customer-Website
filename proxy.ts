import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication (booking, checkout, account management, etc.).
// All other browsing routes (home /, /services, /search, /deals, /support, /privacy, /terms, etc.)
// remain publicly accessible without logging in.
const PROTECTED_PREFIXES = [
  '/checkout',
  '/cart',
  '/bookings',
  '/profile',
  '/wallet',
  '/chat',
  '/notifications',
  '/disputes',
  '/invoices',
  '/favorites',
  '/payments',
  '/recurring-bookings',
  '/onboarding',
  '/subscription/my',
  '/support',
];

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

  // Allow static assets, next internal files, and public browsing routes
  if (isAssetPath(pathname) || !PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
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
