// app/api/delivery/assign/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { assignDelivery } from '@/lib/delivery';
import { errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { orderId } = await req.json();
  if (!orderId) return errorResponse('orderId required', 'MISSING_FIELDS');

  const assignment = await assignDelivery(orderId);

  if (!assignment) {
    return errorResponse('No delivery boys available', 'NO_DELIVERY_BOY', 503);
  }

  return Response.json({ assignment }, { status: 201 });
}
