// app/api/payments/verify/route.ts

import { NextRequest } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { orderId, paymentId, signature } = await req.json();

  if (!orderId || !paymentId || !signature) {
    return errorResponse('Missing verification fields', 'MISSING_FIELDS');
  }

  const isValid = verifyPaymentSignature(orderId, paymentId, signature);

  if (!isValid) {
    return errorResponse('Invalid payment signature', 'INVALID_SIGNATURE', 400);
  }

  return Response.json({ verified: true });
}
