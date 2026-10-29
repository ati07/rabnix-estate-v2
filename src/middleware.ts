import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'baybayt_session';
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-insecure-secret-change-me'
);

// Server-side guard for the Master Admin portal. The API routes are already
// role-gated, but without this the /admin *page shell* renders for anyone who
// navigates to it. This verifies the session JWT at the edge and lets only
// authenticated admins through — everyone else is redirected before render.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  const signInUrl = new URL('/auth', req.url);
  const dashboardUrl = new URL('/dashboard', req.url);

  if (!token) {
    return NextResponse.redirect(signInUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    // Both admin and superadmin may enter the portal; superadmin is a superset.
    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  } catch {
    // Invalid/expired token → treat as signed out.
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
