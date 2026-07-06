import { NextRequest, NextResponse } from 'next/server';

// Routes that must stay reachable WITHOUT being logged in.
const PUBLIC_PATHS = ['/login'];

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

  if (isAssetPath(pathname) || PUBLIC_PATHS.includes(pathname)) {
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
