// app/api/orders/[id]/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerPusherEvent, businessChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { errorResponse } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*, customer:customers(name, phone), delivery_boy:delivery_boys(name, phone), business:businesses(owner_email)')
    .eq('id', params.id)
    .single();

  if (error || !order) return errorResponse('Order not found', 'NOT_FOUND', 404);

  const business = order.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  return Response.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('business_id, business:businesses(owner_email)')
    .eq('id', params.id)
    .single();

  if (!order) return errorResponse('Order not found', 'NOT_FOUND', 404);

  const business = order.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  await triggerPusherEvent(
    businessChannel(order.business_id),
    PUSHER_EVENTS.ORDER_UPDATED,
    { orderId: params.id, status: updated.status }
  );

  return Response.json({ order: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('business:businesses(owner_email), business_id')
    .eq('id', params.id)
    .single();

  if (!order) return errorResponse('Not found', 'NOT_FOUND', 404);

  const business = order.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', params.id);

  await triggerPusherEvent(
    businessChannel(order.business_id),
    PUSHER_EVENTS.ORDER_UPDATED,
    { orderId: params.id, status: 'cancelled' }
  );

  return Response.json({ success: true });
}
