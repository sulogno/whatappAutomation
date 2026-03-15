// lib/razorpay.ts — Razorpay client

import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayInstance;
}

export const RAZORPAY_PLAN_IDS = {
  starter: 'plan_starter_199',
  growth: 'plan_growth_399',
  pro: 'plan_pro_999',
} as const;

export async function createSubscription(
  businessId: string,
  planId: 'starter' | 'growth' | 'pro'
): Promise<{ id: string; short_url: string }> {
  const razorpay = getRazorpay();
  const razorpayPlanId = RAZORPAY_PLAN_IDS[planId];

  const subscription = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    quantity: 1,
    customer_notify: 1,
    total_count: 12, // 12 months
    notes: {
      business_id: businessId,
      plan: planId,
    },
  });

  return {
    id: subscription.id,
    short_url: (subscription as { short_url?: string }).short_url || '',
  };
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
