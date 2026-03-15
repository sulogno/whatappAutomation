// app/api/delivery/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { assignDelivery } from '@/lib/delivery';
import { errorResponse, normalizePhone } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  const { data: boys, error } = await supabaseAdmin
    .from('delivery_boys')
    .select('*, current_order:orders(order_number, status)')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name');

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ delivery_boys: boys || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();
  const { name, phone, whatsappNumber } = body;

  if (!name || !phone || !whatsappNumber) {
    return errorResponse('name, phone, and whatsappNumber are required', 'MISSING_FIELDS');
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  const { data: boy, error } = await supabaseAdmin
    .from('delivery_boys')
    .insert({
      business_id: business.id,
      name,
      phone: normalizePhone(phone),
      whatsapp_number: normalizePhone(whatsappNumber),
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ delivery_boy: boy }, { status: 201 });
}
