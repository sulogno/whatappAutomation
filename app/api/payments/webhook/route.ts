// app/api/payments/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { sendTextMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  // Verify signature
  if (!verifyWebhookSignature(body, signature)) {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);
  const eventType = event.event as string;
  const payload = event.payload;

  try {
    if (eventType === 'subscription.activated') {
      const subscriptionId = payload.subscription.entity.id;
      const planId = payload.subscription.entity.plan_id;

      // Map Razorpay plan ID to our plan name
      const planMap: Record<string, string> = {
        plan_starter_199: 'starter',
        plan_growth_399: 'growth',
        plan_pro_999: 'pro',
      };
      const plan = planMap[planId] || 'starter';

      const messageLimits: Record<string, number> = {
        starter: 500,
        growth: 2000,
        pro: 10000,
      };

      // Calculate expiry (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabaseAdmin
        .from('businesses')
        .update({
          plan,
          plan_expires_at: expiresAt.toISOString(),
          monthly_message_limit: messageLimits[plan],
        })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    if (eventType === 'subscription.charged') {
      const subscriptionId = payload.subscription.entity.id;

      // Reset monthly message count on renewal
      await supabaseAdmin
        .from('businesses')
        .update({ monthly_message_count: 0 })
        .eq('razorpay_subscription_id', subscriptionId);
    }

    if (eventType === 'subscription.cancelled') {
      const subscriptionId = payload.subscription.entity.id;

      // Find business and schedule downgrade
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select()
        .eq('razorpay_subscription_id', subscriptionId)
        .single();

      if (business) {
        // Downgrade to free after plan expires
        const expiresAt = business.plan_expires_at
          ? new Date(business.plan_expires_at)
          : new Date();

        // We'll keep the current plan until expiry, then downgrade
        // The cron job should handle this
        await supabaseAdmin
          .from('businesses')
          .update({ razorpay_subscription_id: null })
          .eq('id', business.id);

        // Notify owner
        await sendTextMessage({
          phoneNumberId: business.whatsapp_phone_id,
          accessToken: business.whatsapp_access_token,
          to: business.owner_phone,
          message: `ℹ️ *ReplyFast Subscription*\n\nAapka subscription cancel ho gaya hai. Aap plan expiry tak current features use kar sakte hain.\n\nDobara subscribe karne ke liye dashboard visit karein 🙏`,
        });
      }
    }

    if (eventType === 'payment.failed') {
      const subscriptionId = payload.subscription?.entity?.id;
      if (subscriptionId) {
        const { data: business } = await supabaseAdmin
          .from('businesses')
          .select()
          .eq('razorpay_subscription_id', subscriptionId)
          .single();

        if (business) {
          await sendTextMessage({
            phoneNumberId: business.whatsapp_phone_id,
            accessToken: business.whatsapp_access_token,
            to: business.owner_phone,
            message: `⚠️ *Payment Failed*\n\nAapka ReplyFast payment process nahi ho paya. Please dashboard mein payment update karein 🙏`,
          });
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[Payments Webhook] Error:', error);
    return new NextResponse('OK', { status: 200 }); // Always return 200
  }
}
