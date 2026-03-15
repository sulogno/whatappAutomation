// middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // Always allow: static files, API routes, public pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/') ||
    pathname === '/'
  ) {
    return res;
  }

  // Auth callback — always allow through
  if (pathname.startsWith('/auth/')) {
    return res;
  }

  // Not logged in
  if (!session) {
    // Allow login and signup pages
    if (pathname === '/login' || pathname === '/signup') {
      return res;
    }
    // Everything else → send to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ✅ Already logged in and trying to visit /login → send to dashboard
  // Dashboard layout will handle the onboarding check
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
