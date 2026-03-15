// app/api/bookings/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { addToQueue } from '@/lib/queue';
import { sendBookingConfirmation } from '@/lib/whatsapp';
import { errorResponse, getTodayDate, normalizePhone } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  let query = supabaseAdmin
    .from('bookings')
    .select('*, customer:customers(name, phone)')
    .eq('business_id', business.id)
    .order('slot_date', { ascending: true })
    .order('slot_time', { ascending: true });

  if (date) query = query.eq('slot_date', date);

  const { data: bookings, error } = await query;
  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  return Response.json({ bookings: bookings || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessId, customerPhone, customerName, serviceType, slotDate, slotTime, notes } = body;

  if (!businessId || !customerPhone || !slotDate || !slotTime) {
    return errorResponse('Missing required fields', 'MISSING_FIELDS');
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select()
    .eq('id', businessId)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  // Double-check slot availability (race condition prevention)
  const { count } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('slot_date', slotDate)
    .eq('slot_time', slotTime)
    .eq('status', 'confirmed');

  // Get slot config for max concurrent
  const dayOfWeek = new Date(slotDate).getDay();
  const { data: slotConfig } = await supabaseAdmin
    .from('slot_config')
    .select('max_concurrent')
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
    .single();

  const maxConcurrent = slotConfig?.max_concurrent || 1;
  if ((count || 0) >= maxConcurrent) {
    return errorResponse('This slot is no longer available', 'SLOT_TAKEN', 409);
  }

  // Find or create customer
  const phone = normalizePhone(customerPhone);
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .upsert(
      { business_id: businessId, phone, name: customerName },
      { onConflict: 'business_id,phone' }
    )
    .select()
    .single();

  // Create booking
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      business_id: businessId,
      customer_id: customer?.id,
      customer_name: customerName,
      customer_phone: phone,
      service_type: serviceType,
      slot_date: slotDate,
      slot_time: slotTime,
      status: 'confirmed',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  // If booking is for today, add to queue
  if (slotDate === getTodayDate()) {
    await addToQueue({
      businessId,
      customerPhone: phone,
      customerName,
      serviceType,
      entryType: 'booking',
      bookingId: booking.id,
      customerId: customer?.id,
    });
  }

  // Send WhatsApp confirmation
  await sendBookingConfirmation({
    phoneNumberId: business.whatsapp_phone_id,
    accessToken: business.whatsapp_access_token,
    customerPhone: phone,
    customerName: customerName || 'Customer',
    serviceType: serviceType || 'Appointment',
    slotDate,
    slotTime,
    businessName: business.name,
  });

  return Response.json({ booking }, { status: 201 });
}
