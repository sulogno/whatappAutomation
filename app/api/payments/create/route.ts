// app/api/payments/create/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { createSubscription } from '@/lib/razorpay';
import { errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { plan } = await req.json();

  if (!['starter', 'growth', 'pro'].includes(plan)) {
    return errorResponse('Invalid plan', 'INVALID_PLAN');
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, name')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  try {
    const subscription = await createSubscription(
      business.id,
      plan as 'starter' | 'growth' | 'pro'
    );

    // Save subscription ID
    await supabaseAdmin
      .from('businesses')
      .update({ razorpay_subscription_id: subscription.id })
      .eq('id', business.id);

    return Response.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('[Payments] Create subscription error:', error);
    return errorResponse('Failed to create subscription', 'PAYMENT_ERROR', 500);
  }
}
