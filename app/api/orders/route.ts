// app/api/orders/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { assignDelivery } from '@/lib/delivery';
import { triggerPusherEvent, businessChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { sendTextMessage } from '@/lib/whatsapp';
import { errorResponse } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  let query = supabaseAdmin
    .from('orders')
    .select('*, customer:customers(name, phone), delivery_boy:delivery_boys(name, phone)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data: orders, error } = await query;
  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ orders: orders || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessId, customerId, items, totalAmount, deliveryType, deliveryAddress, paymentMethod, specialInstructions } = body;

  if (!businessId || !items || !totalAmount) {
    return errorResponse('Missing required fields', 'MISSING_FIELDS');
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select()
    .eq('id', businessId)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  // Create order
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      business_id: businessId,
      customer_id: customerId,
      items,
      total_amount: totalAmount,
      status: 'confirmed',
      delivery_type: deliveryType || 'pickup',
      delivery_address: deliveryAddress || null,
      payment_method: paymentMethod || 'cod',
      special_instructions: specialInstructions || null,
      estimated_time: deliveryType === 'delivery' ? 45 : 20,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  // Update customer order count
  if (customerId) {
    const { data: cust } = await supabaseAdmin
      .from('customers').select('total_orders').eq('id', customerId).single();
    if (cust) {
      await supabaseAdmin
        .from('customers')
        .update({ total_orders: (cust.total_orders || 0) + 1 })
        .eq('id', customerId);
    }
  }

  // Notify owner via WhatsApp
  const itemsList = items
    .map((item: { name: string; qty: number; price: number }) => `• ${item.name} x${item.qty}`)
    .join('\n');

  await sendTextMessage({
    phoneNumberId: business.whatsapp_phone_id,
    accessToken: business.whatsapp_access_token,
    to: business.owner_phone,
    message: `🛒 *New Order #${order.order_number}!*\n\n${itemsList}\n\n*Total: ₹${totalAmount}*\n${deliveryType === 'delivery' ? `📍 Delivery to: ${deliveryAddress}` : '🏪 Pickup order'}\nPayment: ${paymentMethod?.toUpperCase() || 'COD'}`,
  });

  // Assign delivery if needed
  if (deliveryType === 'delivery') {
    await assignDelivery(order.id);
  }

  // Trigger real-time update
  await triggerPusherEvent(
    businessChannel(businessId),
    PUSHER_EVENTS.NEW_ORDER,
    { order }
  );

  return Response.json({ order }, { status: 201 });
}
