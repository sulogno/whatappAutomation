// app/auth/callback/route.ts
// Handles OAuth callback (Google) and email confirmation links

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);

    // Check if user has a business set up
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_email', session.user.email)
        .maybeSingle();

      if (business) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }
  }

  return NextResponse.redirect(new URL('/login', req.url));
}
