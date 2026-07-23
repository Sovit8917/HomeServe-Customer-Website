import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
const INTERNAL_AUTH_SECRET = process.env.INTERNAL_AUTH_SECRET;

/**
 * Called by the browser right after a successful Better Auth login
 * (Google or email/password). Reads the just-created Better Auth
 * session server-side (via cookies — never trusts a client-supplied
 * user id), then exchanges it for a NestJS-compatible JWT so the rest
 * of the site can keep using the existing axios/zustand auth flow
 * (see store/auth.ts's setAuth) exactly as it did with phone-OTP login.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
  }

  if (!INTERNAL_AUTH_SECRET) {
    console.error('INTERNAL_AUTH_SECRET is not set — cannot bridge to backend');
    return NextResponse.json(
      { message: 'Server misconfigured' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/session-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_AUTH_SECRET,
      },
      body: JSON.stringify({ userId: session.user.id }),
    });

    const body = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: body?.message || 'Could not create session' },
        { status: res.status },
      );
    }

    return NextResponse.json(body);
  } catch (err) {
    console.error('backend-token bridge failed:', err);
    return NextResponse.json(
      { message: 'Could not reach backend' },
      { status: 502 },
    );
  }
}
