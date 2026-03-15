// app/api/queue/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { addToQueue } from '@/lib/queue';
import { sendQueueNotification } from '@/lib/whatsapp';
import { errorResponse, getTodayDate, normalizePhone } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getTodayDate();

  // Get business for this user
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  const { data: queue, error } = await supabaseAdmin
    .from('queue')
    .select('*')
    .eq('business_id', business.id)
    .eq('date', date)
    .order('token_number', { ascending: true });

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ queue: queue || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();
  const { customerPhone, customerName, serviceType, entryType, bookingId } = body;

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select()
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  // Find or create customer
  let customerId: string | undefined;
  if (customerPhone) {
    const phone = normalizePhone(customerPhone);
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .upsert({ business_id: business.id, phone, name: customerName }, { onConflict: 'business_id,phone' })
      .select()
      .single();
    customerId = customer?.id;
  }

  const entry = await addToQueue({
    businessId: business.id,
    customerPhone: customerPhone ? normalizePhone(customerPhone) : undefined,
    customerName,
    serviceType,
    entryType: entryType || 'online',
    bookingId,
    customerId,
  });

  // Send WhatsApp notification if phone provided
  if (customerPhone && entry) {
    await sendQueueNotification({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      customerPhone: normalizePhone(customerPhone),
      tokenNumber: entry.token_number,
      estimatedWait: entry.estimated_wait || 0,
      businessName: business.name,
      type: 'assigned',
    });
  }

  return Response.json({ entry }, { status: 201 });
}
